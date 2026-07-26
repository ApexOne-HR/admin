export type FiscalYear = {
  id: number;
  company_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  company?: { id: number; name: string };
  created_at: string;
  updated_at: string;
};

export type FiscalYearPayload = {
  company_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
};
