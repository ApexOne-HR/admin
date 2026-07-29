export type OrgChartEmployeeNode = {
  id: number;
  employee_code: string;
  full_name: string;
  status: string;
  designation: { id: number; name: string } | null;
  report_to: number | null;
  reporting_cycle: boolean;
  children: OrgChartEmployeeNode[];
};

export type OrgChartDepartmentNode = {
  id: number | null;
  name: string;
  is_unassigned: boolean;
  employee_count: number;
  employees: OrgChartEmployeeNode[];
};

export type OrgChartDivisionNode = {
  id: number | null;
  name: string;
  is_unassigned: boolean;
  employee_count: number;
  departments: OrgChartDepartmentNode[];
};

export type OrgChart = {
  company: { id: number; name: string };
  selected_division_id: number | null;
  selected_department_id: number | null;
  divisions: OrgChartDivisionNode[];
  employee_count: number;
};
