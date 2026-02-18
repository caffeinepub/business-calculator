import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import List "mo:core/List";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Migration "migration";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Use migration function through with-clause
(with migration = Migration.run)
actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Operations
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Trade Journal Types
  type TradeDirection = { #buy; #sell };
  type TradeType = { #forex; #crypto; #stock };
  type DataType = { #string; #nat; #float; #tradeDirection ; #tradeType };

  type CustomColumn = {
    id : Text;
    name : Text;
    dataType : DataType;
    owner : Principal;
  };

  type Trade = {
    id : Text;
    userId : Principal;
    symbol : Text;
    amount : Nat;
    price : Float;
    direction : TradeDirection;
    tradeType : TradeType;
    customFields : Map.Map<Text, CustomFieldValue>;
  };

  public type TradeView = {
    id : Text;
    userId : Principal;
    symbol : Text;
    amount : Nat;
    price : Float;
    direction : TradeDirection;
    tradeType : TradeType;
    customFields : [CustomFieldView];
  };

  public type CustomFieldValue = {
    #string : Text;
    #nat : Nat;
    #float : Float;
    #tradeDirection : TradeDirection;
    #tradeType : TradeType;
  };

  public type CustomFieldView = {
    columnId : Text;
    value : CustomFieldValue;
  };

  module Trade {
    public func compare(trade1 : Trade, trade2 : Trade) : Order.Order {
      Text.compare(trade1.id, trade2.id);
    };
  };

  let trades = Map.empty<Text, Trade>();
  let customColumns = Map.empty<Text, CustomColumn>();

  // Custom Column Operations
  public shared ({ caller }) func createCustomColumn(
    id : Text,
    name : Text,
    dataType : DataType,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create custom columns");
    };
    if (customColumns.containsKey(id)) {
      Runtime.trap("Custom column with this id already exists");
    };
    let column : CustomColumn = {
      id;
      name;
      dataType;
      owner = caller;
    };
    customColumns.add(id, column);
  };

  public shared ({ caller }) func deleteCustomColumn(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete custom columns");
    };
    switch (customColumns.get(id)) {
      case (null) { Runtime.trap("Custom column with this id does not exist") };
      case (?column) {
        if (column.owner != caller) {
          Runtime.trap("Only the creator can delete this custom column");
        };
        customColumns.remove(id);

        // Remove associated custom field values from trades
        for ((tradeId, trade) in trades.entries()) {
          let newCustomFields = Map.empty<Text, CustomFieldValue>();
          for ((fieldId, value) in trade.customFields.entries()) {
            if (fieldId != id) {
              newCustomFields.add(fieldId, value);
            };
          };
          let updatedTrade = { trade with customFields = newCustomFields };
          trades.add(tradeId, updatedTrade);
        };
      };
    };
  };

  public query ({ caller }) func getCustomColumns() : async [(Text, CustomColumn)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view custom columns");
    };
    customColumns.toArray();
  };

  // Trade Operations
  public shared ({ caller }) func createTrade(
    id : Text,
    symbol : Text,
    amount : Nat,
    price : Float,
    direction : TradeDirection,
    tradeType : TradeType,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create trades");
    };
    if (trades.containsKey(id)) {
      Runtime.trap("Trade with this id already exists");
    };
    let trade : Trade = {
      id;
      userId = caller;
      symbol;
      amount;
      price;
      direction;
      tradeType;
      customFields = Map.empty<Text, CustomFieldValue>();
    };
    trades.add(id, trade);
  };

  public shared ({ caller }) func updateTrade(
    id : Text,
    symbol : Text,
    amount : Nat,
    price : Float,
    direction : TradeDirection,
    tradeType : TradeType,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update trades");
    };
    switch (trades.get(id)) {
      case (null) { Runtime.trap("Trade with this id does not exist") };
      case (?trade) {
        if (trade.userId != caller) {
          Runtime.trap("Only the creator can update this trade");
        };
        let updatedTrade : Trade = {
          id;
          userId = caller;
          symbol;
          amount;
          price;
          direction;
          tradeType;
          customFields = trade.customFields;
        };
        trades.add(id, updatedTrade);
      };
    };
  };

  public shared ({ caller }) func deleteTrade(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete trades");
    };
    switch (trades.get(id)) {
      case (null) { Runtime.trap("Trade with this id does not exist") };
      case (?trade) {
        if (trade.userId != caller) {
          Runtime.trap("Only the creator can delete this trade");
        };
        trades.remove(id);
      };
    };
  };

  public query ({ caller }) func getTrade(id : Text) : async TradeView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    switch (trades.get(id)) {
      case (null) { Runtime.trap("Trade with this id does not exist") };
      case (?trade) {
        { trade with
          customFields = trade.customFields.toArray().map<(Text, CustomFieldValue), CustomFieldView>(
            func((key, value)) {
              { columnId = key; value };
            }
          );
        };
      };
    };
  };

  public query ({ caller }) func getAllTrades() : async [TradeView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    trades.values().toArray().sort().map<Trade, TradeView>(
      func(trade) {
        { trade with
          customFields = trade.customFields.toArray().map<(Text, CustomFieldValue), CustomFieldView>(
            func((key, value)) {
              { columnId = key; value };
            }
          );
        };
      }
    );
  };

  // Custom Field Value Operations
  public shared ({ caller }) func setCustomFieldValue(
    tradeId : Text,
    columnId : Text,
    value : CustomFieldValue,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set custom field values");
    };
    switch (trades.get(tradeId)) {
      case (null) { Runtime.trap("Trade with this id does not exist") };
      case (?trade) {
        if (trade.userId != caller) {
          Runtime.trap("Only the creator can modify custom fields for this trade");
        };
        switch (customColumns.get(columnId)) {
          case (null) { Runtime.trap("Custom column with this id does not exist") };
          case (?column) {
            if (not isValueCompatibleWithDataType(value, column.dataType)) {
              Runtime.trap("Value does not match column data type");
            };
            let updatedCustomFields = Map.empty<Text, CustomFieldValue>();
            for ((key, val) in trade.customFields.entries()) {
              updatedCustomFields.add(key, val);
            };
            updatedCustomFields.add(columnId, value);
            let updatedTrade = { trade with customFields = updatedCustomFields };
            trades.add(tradeId, updatedTrade);
          };
        };
      };
    };
  };

  public query ({ caller }) func getCustomFieldValue(
    tradeId : Text,
    columnId : Text,
  ) : async CustomFieldValue {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view custom field values");
    };
    switch (trades.get(tradeId)) {
      case (null) { Runtime.trap("Trade with this id does not exist") };
      case (?trade) {
        switch (trade.customFields.get(columnId)) {
          case (null) { Runtime.trap("Custom field value does not exist") };
          case (?value) { value };
        };
      };
    };
  };

  public query ({ caller }) func getCustomFieldsForTrade(
    tradeId : Text,
  ) : async [CustomFieldView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view custom fields");
    };
    switch (trades.get(tradeId)) {
      case (null) { Runtime.trap("Trade with this id does not exist") };
      case (?trade) {
        trade.customFields.toArray().map<(Text, CustomFieldValue), CustomFieldView>(
          func((key, value)) {
            { columnId = key; value };
          }
        );
      };
    };
  };

  // Fetch all custom fields for a specific column across all trades
  public query ({ caller }) func getCustomFieldsByColumn(
    columnId : Text,
  ) : async [(Text, CustomFieldValue)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view custom fields");
    };
    // Check if the column exists
    switch (customColumns.get(columnId)) {
      case (null) { Runtime.trap("Custom column with this id does not exist") };
      case (?_column) {
        let fieldsList = List.empty<(Text, CustomFieldValue)>();

        // Iterate through all trades and collect those with the specified columnId
        for ((tradeId, trade) in trades.entries()) {
          switch (trade.customFields.get(columnId)) {
            case (null) {}; // Ignore trades without the custom field
            case (?value) {
              fieldsList.add((tradeId, value));
            };
          };
        };

        fieldsList.toArray();
      };
    };
  };

  func isValueCompatibleWithDataType(
    value : CustomFieldValue,
    dataType : DataType,
  ) : Bool {
    switch (value) {
      case (#string(_)) { switch (dataType) { case (#string) { true }; case (_) { false } } };
      case (#nat(_)) { switch (dataType) { case (#nat) { true }; case (_) { false } } };
      case (#float(_)) { switch (dataType) { case (#float) { true }; case (_) { false } } };
      case (#tradeDirection(_)) {
        switch (dataType) {
          case (#tradeDirection) { true };
          case (_) { false };
        };
      };
      case (#tradeType(_)) { switch (dataType) { case (#tradeType) { true }; case (_) { false } } };
    };
  };
};
