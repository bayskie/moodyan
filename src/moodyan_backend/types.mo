import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";

module {
  public type Journal = {
    id : Nat;
    title : Text;
    content : Text;
    mood : ?Text;
    reflection : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type AnalysisResult = {
    mood : Text;
    reflection : Text;
  };

  public type Error = {
    #NotFound : Text;
    #AlreadyExists : Text;
    #NotAuthorized : Text;
    #InvalidInput : Text;
  };
};
