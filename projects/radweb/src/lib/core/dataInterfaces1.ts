import { Column, Entity, Sort, SortSegment, StringColumn } from './utils';
import { FindOptions } from './dataInterfaces1';
import { UserInfo, Allowed } from '../context/Context';




export interface DataProvider {
  count(where: FilterBase): Promise<number>;
  find(options?: FindOptions): Promise<Array<any>>;
  update(id: any, data: any): Promise<any>;
  delete(id: any): Promise<void>;
  insert(data: any): Promise<any>;
}
export interface FindOptions extends FindOptionsBase {
  orderBy?: Sort;
}
export interface EntitySourceFindOptions extends FindOptionsBase {
  orderBy?: Sort | Column<any> | (Column<any> | SortSegment)[];
}

export interface FindOptionsBase {
  where?: FilterBase;

  limit?: number;
  page?: number;
  additionalUrlParameters?: any;
}
export interface FindOptionsPerEntity<rowType extends Entity<any>> {
  where?: (rowType: rowType) => FilterBase;
  orderBy?: ((rowType: rowType) => Sort) | ((rowType: rowType) => (Column<any>)) | ((rowType: rowType) => (Column<any> | SortSegment)[]);
  limit?: number;
  page?: number;
  additionalUrlParameters?: any;
}

export interface DataProviderFactory {
  provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider;

}

export interface RowsOfDataForTesting {
  getRows(key: string): any[] | Promise<Array<any>>;
  setRows(key: string, rows: any[]);
}
export interface SupportsTransaction extends DataProviderFactory {
  doInTransaction(what: (dp: DataProviderFactory) => Promise<void>): Promise<void>;

}
export interface ColumnValueProvider {
  getValue(key: string): any;
  getOriginalValue(key: string): any;
  setValue(key: string, value: any): void;
}
export declare type ColumnOptions<type> = DataColumnSettings<type> | string;
export interface DataColumnSettings<type> {
  jsonName?: string;
  includeInApi?: Allowed;
  caption?: string;
  allowApiUpdate?: Allowed;
  inputType?: string;
  dbName?: string | (() => string);
  value?: type;
  storage?: ColumnStorage<type>;
  onValidate?: () => void | Promise<void>;
  getValue?: (val: type) => any;
  valueChange?: (val: type) => void;
  virtualData?: () => type | Promise<type>;
  dbReadOnly?: boolean;
}
export interface ColumnStorage<dataType> {
  toDb(val: dataType): any;
  fromDb(val: any): dataType;
}
export interface RowEvents {
  rowDeleted?: () => void;
  rowSaved?: (newRow: boolean) => void;
  rowReset?: (newRow: boolean) => void;
}


export interface FilterBase {
  __applyToConsumer(add: FilterConsumer): void;
}
export interface FilterConsumer {
  isEqualTo(col: Column<any>, val: any): void;
  isDifferentFrom(col: Column<any>, val: any): void;
  isGreaterOrEqualTo(col: Column<any>, val: any): void;
  isGreaterThan(col: Column<any>, val: any): void;
  isLessOrEqualTo(col: Column<any>, val: any): void;
  isLessThan(col: Column<any>, val: any): void;
  isContains(col: StringColumn, val: any): void;
  isStartsWith(col: StringColumn, val: any): void;
}

export interface DataApiRequest {
  get(key: string): any;
  getHeader(key: string): string;
  user: UserInfo;
  clientIp: string;
}
export interface DataApiServer {
  addAllowedHeader(name: string): void;
  addRequestProcessor(processAndReturnTrueToAouthorise: (req: DataApiRequest) => Promise<boolean>): void;

}