export interface Item {
  Id?: string;
  IdUi?: string;
  Selected?: boolean;
  ItemId: string;
  RelatedId: string;
  RelatedParentId: string;
  Name: string;
  CompanyId?: string;
  ParentId?: string;
  ItemType?: string;
  Description?: string;
  OrderingNo?: number;
  Price?: number;
  LimitValue: number;
  OffLimitPrice: number;
  ItemStatus?: string;
  ItemCode?: string;
  ImageUrl?: string;
  ItemPin?: string;
  ItemCategory: string;
  ItemSubCategory?: string;
  CreateDate?: string;
  CreateUserId?: string;
  ModifyDate?: string;
  ModifyUserId?: string;
  StatusId?: number;
  Children?: Item[];
  SelectedItemId?: string;
  ShowMore?: boolean;
}

export const item: Item = {
  ItemId: '',
  RelatedId: '',
  RelatedParentId: '',
  Name: '',
  ParentId: '',
  ItemType: '',
  CompanyId: '',
  Description: '',
  OrderingNo: 1,
  Price: 0,
  LimitValue: 0,
  OffLimitPrice: 0,
  ItemStatus: '',
  ItemCode: '',
  ImageUrl: '',
  ItemPin: '',
  ItemCategory: '',
  ItemSubCategory: '',
  CreateUserId: '',
  ModifyUserId: '',
  StatusId: 1
}