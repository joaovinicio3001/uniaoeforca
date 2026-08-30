export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1 text-xs font-medium text-destructive" role="alert">
      {errors[0]}
    </p>
  );
}
