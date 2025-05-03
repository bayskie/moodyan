import LLM "mo:llm";
import JSON "mo:serde/JSON";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import T "types";

actor {
  public func deserializeAnalysisJSON(json : Text) : async ?T.AnalysisResult {
    let parsed = JSON.fromText(json, null);
    switch (parsed) {
      case (#ok(blob)) {
        let analysisResult : ?T.AnalysisResult = from_candid (blob);
        return analysisResult;
      };
      case (#err(err)) {
        Debug.print("error: " # err);
        return null;
      };
    };
  };

  public func analyzeJournal(journalContent : Text) : async Text {
    let prompt = "You are a compassionate psychologist. Analyze journal and reply ONLY with JSON: {\"mood\": \"happy|sad|angry|anxious|exhausted|neutral\", \"reflection\": \"personal, empathetic, and supportive message\"}. Choose only ONE mood from the list. Journal: " # journalContent;

    try {
      let rawJSON = await LLM.prompt(#Llama3_1_8B, prompt);
      return rawJSON;
    } catch (_) {
      return "{\"mood\": \"neutral\", \"reflection\": \"Sorry, I could not analyze your journal. I hope you have a good day!\"}";
    };
  };
};
