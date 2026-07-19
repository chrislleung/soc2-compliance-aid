import type { Employee } from "@/lib/contracts";

export function EmployeeSelector({
  employees,
  value,
  onChange,
  label = "Demo employee",
}: {
  employees: Employee[];
  value: string;
  onChange: (employeeId: string) => void;
  label?: string;
}) {
  return (
    <label className="flex max-w-xs flex-col gap-1 text-sm">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
    </label>
  );
}
