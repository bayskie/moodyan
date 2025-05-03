import Nat "mo:base/Nat";
import Text "mo:base/Text";

module {
  private type Datetime = Text;

  public type Journal = {
    id : Nat;
    title : Text;
    content : Text;
    mood : Text;
    reflection : Text;
    created_at : Datetime;
    updated_at : Datetime;
  };

  public type AnalysisResult = {
    mood : Text;
    reflection : Text;
  };
};
