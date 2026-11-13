export interface Terminal {
  _id: string;
  realDevices: 'Yes' | 'No';
  terminalName: string;
  terminalId: string;
  apiToken: string;
  storeId: string;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
}

export interface Till {
  tillNo: string;
  tillName: string;
  createdDate: string;
}

export interface StoreTiming {
  day: string;
  startTime: string;
  endTime: string;
  isHoliday: 'Yes' | 'No';
}

export interface TimingUpdate {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: boolean;
  createdDate: string;
}

export interface Holiday {
  startDate: string;
  endDate: string;
  status: boolean;
  createdDate: string;
}

export interface TaxFeesSettings {
  deliveryFee: string | number;
  gstTaxRate: string | number;
  pstTaxRate: string | number;
  hstTaxRate: string | number;
}

export type TabType = 'main_settings' | 'tax_fees' | 'terminal_setup' | 'till_setup' | 'store_timings' | 'store_timings_update' | 'holidays' | 'kitchen_stations';

// ── Kitchen Station Configuration Types ─────────────────────────
export type StationId =
  | 'all'
  | 'fast_food'
  | 'tandoor'
  | 'chinese'
  | 'main_kitchen'
  | 'beverages'
  | 'general'
  | 'make_table'
  | 'cut_station'
  | 'wings_station';

export type ItemType =
  | 'all'
  | 'fast_food'
  | 'tandoor'
  | 'chinese'
  | 'main_kitchen'
  | 'beverages'
  | 'general'
  | 'pizza'
  | 'wings';

export interface StationConfig {
  id: StationId;
  label: string;
  isEnabled: boolean;
  handlesItemTypes: ItemType[];
  nextStation: string | null; // e.g. null
  autoPrint: {
    pizza?: boolean;
    wings?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface KitchenSettings {
  presetMode: 'indian_multi_station' | 'indian_cafe' | 'single_kitchen' | '3_station' | '2_station' | '1_station' | 'custom';
  stations: StationConfig[];
}

// Default Indian Restaurant RMS station config
export const DEFAULT_KITCHEN_SETTINGS: KitchenSettings = {
  presetMode: 'indian_multi_station',
  stations: [
    { id: 'all',          label: 'All Stations',  isEnabled: true,  handlesItemTypes: ['all'],         nextStation: null, autoPrint: { pizza: true, wings: true } },
    { id: 'fast_food',    label: 'Fast Food',     isEnabled: true,  handlesItemTypes: ['fast_food'],   nextStation: null, autoPrint: { pizza: true, wings: true } },
    { id: 'main_kitchen', label: 'Main Kitchen',  isEnabled: true,  handlesItemTypes: ['main_kitchen'], nextStation: null, autoPrint: { pizza: true, wings: true } },
    { id: 'tandoor',      label: 'Tandoor',       isEnabled: true,  handlesItemTypes: ['tandoor'],     nextStation: null, autoPrint: { pizza: true, wings: true } },
    { id: 'chinese',      label: 'Chinese / Wok', isEnabled: true,  handlesItemTypes: ['chinese'],     nextStation: null, autoPrint: { pizza: true, wings: true } },
    { id: 'beverages',    label: 'Beverages',     isEnabled: true,  handlesItemTypes: ['beverages'],   nextStation: null, autoPrint: { pizza: true, wings: true } },
    { id: 'general',      label: 'General',       isEnabled: true,  handlesItemTypes: ['general'],     nextStation: null, autoPrint: { pizza: true, wings: true } },
  ],
};

