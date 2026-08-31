"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createCampaignDraftAction,
  saveCampaignAction,
  wizardMediaAction,
  wizardRemoveImageAction,
  wizardSetCoverAction,
  wizardSubmitForReviewAction,
  wizardUploadImageAction,
} from "@/app/(dashboard)/painel/campanhas/actions";
import {
  initialCampaignFormState,
  type CampaignMediaLite,
} from "@/lib/campaigns/form-state";
import {
  EMPTY_DRAFT,
  WIZARD_LIMITS,
  clearWizardDraft,
  loadWizardDraft,
  reaisMaskToCents,
  saveWizardDraft,
  type WizardDraft,
} from "@/lib/campaigns/wizard";
import { downscaleImage } from "@/lib/images/downscale";
import { WizardStepper } from "./wizard-stepper";
import { WizardActions } from "./wizard-ui";
import { StepBasics } from "./step-basics";
import { StepCategory } from "./step-category";
import { StepStory } from "./step-story";
import { StepImages } from "./step-images";
import { StepReview } from "./step-review";
import { StepSuccess } from "./step-success";

type Category = { slug: string; name: string };

const FIELD_KEY: Record<string, keyof WizardDraft> = {
  title: "title",
  summary: "summary",
  goalAmount: "goalReais",
  categorySlug: "categorySlug",
  story: "story",
};

export function CampaignWizard({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [media, setMedia] = useState<CampaignMediaLite[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | undefined>();
  const hydratedMediaFor = useRef<string | null>(null);

  // Rehidrata o rascunho de texto (sessionStorage) uma vez, no cliente.
  useEffect(() => {
    const saved = loadWizardDraft();
    if (saved) setDraft(saved);
  }, []);

  // Persiste o rascunho de texto a cada alteração.
  useEffect(() => {
    saveWizardDraft(draft);
  }, [draft]);

  const goalCents = useMemo(
    () => reaisMaskToCents(draft.goalReais),
    [draft.goalReais],
  );

  const categoryName = useMemo(
    () => categories.find((c) => c.slug === draft.categorySlug)?.name ?? "",
    [categories, draft.categorySlug],
  );

  const update = useCallback(
    <K extends keyof WizardDraft>(field: K, value: WizardDraft[K]) => {
      setDraft((d) => ({ ...d, [field]: value }));
      setErrors((e) => {
        if (!e[field]) return e;
        const next = { ...e };
        delete next[field];
        return next;
      });
    },
    [],
  );

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("title", draft.title.trim());
    fd.set("summary", draft.summary.trim());
    fd.set("story", draft.story);
    fd.set("categorySlug", draft.categorySlug);
    fd.set("goalAmount", draft.goalReais);
    if (draftId) fd.set("campaignId", draftId);
    return fd;
  }

  function validateBasics(): boolean {
    const e: Record<string, string> = {};
    const t = draft.title.trim();
    if (t.length < WIZARD_LIMITS.titleMin)
      e.title = `Título muito curto (mínimo de ${WIZARD_LIMITS.titleMin} caracteres).`;
    const s = draft.summary.trim();
    if (s.length < WIZARD_LIMITS.summaryMin)
      e.summary = `Resumo muito curto (mínimo de ${WIZARD_LIMITS.summaryMin} caracteres).`;
    if (!draft.goalReais || goalCents < WIZARD_LIMITS.goalMinCents)
      e.goalReais = "Informe uma meta de pelo menos R$ 50,00.";
    else if (goalCents > WIZARD_LIMITS.goalMaxCents)
      e.goalReais = "A meta máxima é R$ 5.000.000,00.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateCategory(): boolean {
    if (!draft.categorySlug) {
      setErrors({ categorySlug: "Selecione uma categoria." });
      return false;
    }
    setErrors({});
    return true;
  }

  function validateStory(): boolean {
    if (draft.story.trim().length < WIZARD_LIMITS.storySoftMin) {
      setErrors({
        story: `Conte um pouco mais da sua história (mínimo de ${WIZARD_LIMITS.storySoftMin} caracteres).`,
      });
      return false;
    }
    setErrors({});
    return true;
  }

  function applyServerErrors(fieldErrors?: Record<string, string[]>) {
    if (!fieldErrors) return;
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(fieldErrors)) {
      const key = FIELD_KEY[k] ?? k;
      if (v[0]) mapped[key] = v[0];
    }
    setErrors(mapped);
  }

  // Cria (ou atualiza) o rascunho real no backend ao sair da etapa "História".
  async function persistDraftAndAdvance() {
    setBusy(true);
    setStepError(undefined);
    try {
      const fd = buildFormData();
      const res = draftId
        ? await saveCampaignAction(initialCampaignFormState, fd)
        : await createCampaignDraftAction(initialCampaignFormState, fd);

      if (res.status === "error") {
        applyServerErrors(res.fieldErrors);
        if (res.fieldErrors?.title || res.fieldErrors?.summary || res.fieldErrors?.goalAmount) {
          setStepError("Revise as informações básicas antes de continuar.");
          setStep(1);
        } else if (res.fieldErrors?.categorySlug) {
          setStep(2);
        } else {
          setStepError(res.message ?? "Não foi possível salvar. Tente novamente.");
        }
        return;
      }
      if (res.campaignId && !draftId) setDraftId(res.campaignId);
      setStep(4);
    } catch {
      setStepError("Não foi possível salvar agora. Verifique sua conexão.");
    } finally {
      setBusy(false);
    }
  }

  // Hidrata a lista de imagens ao entrar na etapa 4.
  useEffect(() => {
    if (step !== 4 || !draftId) return;
    if (hydratedMediaFor.current === draftId) return;
    hydratedMediaFor.current = draftId;
    const fd = new FormData();
    fd.set("campaignId", draftId);
    wizardMediaAction(initialCampaignFormState, fd)
      .then((res) => {
        if (res.media) setMedia(res.media);
      })
      .catch(() => {});
  }, [step, draftId]);

  const uploadImage = useCallback(
    async (raw: File) => {
      if (!draftId) return;
      setImageError(undefined);
      if (raw.size > WIZARD_LIMITS.imageMaxBytes) {
        setImageError("Imagem acima de 5 MB.");
        return;
      }
      setUploading(true);
      try {
        const file = await downscaleImage(raw, { maxSide: 1600, quality: 0.82 });
        const fd = new FormData();
        fd.set("campaignId", draftId);
        fd.set("file", file);
        const res = await wizardUploadImageAction(initialCampaignFormState, fd);
        if (res.media) setMedia(res.media);
        if (res.status === "error")
          setImageError(res.message ?? "Não foi possível enviar esta imagem.");
      } catch {
        setImageError("Não foi possível enviar esta imagem. Tente novamente.");
      } finally {
        setUploading(false);
      }
    },
    [draftId],
  );

  const removeImage = useCallback(
    async (mediaId: string) => {
      if (!draftId) return;
      const fd = new FormData();
      fd.set("campaignId", draftId);
      fd.set("mediaId", mediaId);
      const res = await wizardRemoveImageAction(initialCampaignFormState, fd);
      if (res.media) setMedia(res.media);
    },
    [draftId],
  );

  const setCover = useCallback(
    async (mediaId: string) => {
      if (!draftId) return;
      const fd = new FormData();
      fd.set("campaignId", draftId);
      fd.set("mediaId", mediaId);
      const res = await wizardSetCoverAction(initialCampaignFormState, fd);
      if (res.media) setMedia(res.media);
    },
    [draftId],
  );

  async function submitForReview() {
    if (!draftId) return;
    setBusy(true);
    setStepError(undefined);
    try {
      const fd = new FormData();
      fd.set("campaignId", draftId);
      const res = await wizardSubmitForReviewAction(initialCampaignFormState, fd);
      if (res.status === "error") {
        setStepError(res.message ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      clearWizardDraft();
      router.refresh();
      setStep(6);
    } catch {
      setStepError("Não foi possível enviar agora. Verifique sua conexão.");
    } finally {
      setBusy(false);
    }
  }

  function handleNext() {
    setStepError(undefined);
    if (step === 1 && validateBasics()) setStep(2);
    else if (step === 2 && validateCategory()) setStep(3);
    else if (step === 3 && validateStory()) void persistDraftAndAdvance();
    else if (step === 4) {
      if (media.length === 0) {
        setImageError("Adicione pelo menos uma imagem para continuar.");
        return;
      }
      setStep(5);
    }
  }

  function handleBack() {
    setStepError(undefined);
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="space-y-6">
      {step < 6 && (
        <div className="rounded-[18px] border border-[#E1E8F2] bg-white p-4 shadow-[0_8px_25px_rgba(20,50,100,0.06)] sm:p-5">
          <WizardStepper current={step} />
        </div>
      )}

      <div className="rounded-[20px] border border-[#E1E8F2] bg-white p-5 shadow-[0_8px_25px_rgba(20,50,100,0.06)] sm:p-7">
        {stepError && step !== 5 && (
          <div
            className="mb-5 rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]"
            role="alert"
          >
            {stepError}
          </div>
        )}

        {step === 1 && (
          <>
            <StepBasics draft={draft} update={update} errors={errors} />
            <WizardActions
              onNext={handleNext}
              hideBack
              busy={busy}
            />
          </>
        )}

        {step === 2 && (
          <>
            <StepCategory
              categories={categories}
              value={draft.categorySlug}
              onChange={(slug) => update("categorySlug", slug)}
              error={errors.categorySlug}
            />
            <WizardActions onBack={handleBack} onNext={handleNext} busy={busy} />
          </>
        )}

        {step === 3 && (
          <>
            <StepStory draft={draft} update={update} errors={errors} />
            <WizardActions
              onBack={handleBack}
              onNext={handleNext}
              busy={busy}
              busyLabel="Salvando…"
            />
          </>
        )}

        {step === 4 && (
          <>
            <StepImages
              media={media}
              uploading={uploading}
              error={imageError}
              onUpload={uploadImage}
              onRemove={removeImage}
              onSetCover={setCover}
            />
            <WizardActions onBack={handleBack} onNext={handleNext} busy={busy} />
          </>
        )}

        {step === 5 && draftId && (
          <StepReview
            draft={draft}
            categoryName={categoryName}
            media={media}
            goalCents={goalCents}
            submitting={busy}
            error={stepError}
            onBack={handleBack}
            onSubmit={submitForReview}
          />
        )}

        {step === 6 && draftId && <StepSuccess campaignId={draftId} />}
      </div>
    </div>
  );
}
