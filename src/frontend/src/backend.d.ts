import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomFieldView {
    value: CustomFieldValue;
    columnId: string;
}
export type CustomFieldValue = {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "string";
    string: string;
} | {
    __kind__: "tradeDirection";
    tradeDirection: TradeDirection;
} | {
    __kind__: "tradeType";
    tradeType: TradeType;
};
export interface CustomColumn {
    id: string;
    owner: Principal;
    name: string;
    dataType: DataType;
}
export interface UserProfile {
    name: string;
}
export interface TradeView {
    id: string;
    direction: TradeDirection;
    tradeType: TradeType;
    userId: Principal;
    customFields: Array<CustomFieldView>;
    price: number;
    amount: bigint;
    symbol: string;
}
export enum DataType {
    nat = "nat",
    float_ = "float",
    string_ = "string",
    tradeDirection = "tradeDirection",
    tradeType = "tradeType"
}
export enum TradeDirection {
    buy = "buy",
    sell = "sell"
}
export enum TradeType {
    forex = "forex",
    stock = "stock",
    crypto = "crypto"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomColumn(id: string, name: string, dataType: DataType): Promise<void>;
    createTrade(id: string, symbol: string, amount: bigint, price: number, direction: TradeDirection, tradeType: TradeType): Promise<void>;
    deleteCustomColumn(id: string): Promise<void>;
    deleteTrade(id: string): Promise<void>;
    getAllTrades(): Promise<Array<TradeView>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomColumns(): Promise<Array<[string, CustomColumn]>>;
    getCustomFieldValue(tradeId: string, columnId: string): Promise<CustomFieldValue>;
    getCustomFieldsByColumn(columnId: string): Promise<Array<[string, CustomFieldValue]>>;
    getCustomFieldsForTrade(tradeId: string): Promise<Array<CustomFieldView>>;
    getTrade(id: string): Promise<TradeView>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCustomFieldValue(tradeId: string, columnId: string, value: CustomFieldValue): Promise<void>;
    updateTrade(id: string, symbol: string, amount: bigint, price: number, direction: TradeDirection, tradeType: TradeType): Promise<void>;
}
