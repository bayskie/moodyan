import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Result "mo:base/Result";

module {
  public type Journal = {
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
    #NotFound;
    #AlreadyExists;
    #NotAuthorized;
    #InvalidInput;
  };
};
