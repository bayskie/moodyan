import Result "mo:base/Result";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Types "types";
import LLM "mo:llm";
import JSON "mo:serde/JSON";

module {
    public func validateJournal(
        title : Text,
        content : Text,
    ) : Result.Result<Text, Types.Error> {
        if (Text.size(title) == 0) {
            return #err(#InvalidInput("Journal title cannot be empty"));
        };

        if (Text.size(content) == 0) {
            return #err(#InvalidInput("Journal content cannot be empty"));
        };

        if (Text.size(title) > 100) {
            return #err(#InvalidInput("Journal title cannot be longer than 100 characters"));
        };

        if (Text.size(content) > 1000) {
            return #err(#InvalidInput("Journal content cannot be longer than 1000 characters"));
        };

        return #ok("Journal validated successfully");
    };

    public func analyzeJournal(
        journalContent : Text
    ) : async ?Types.AnalysisResult {
        let prompt = "You are a compassionate psychologist. Analyze journal and reply ONLY with JSON: {\"mood\": \"happy|sad|angry|anxious|exhausted|neutral\", \"reflection\": \"personal, empathetic, and supportive message\"}. Choose only ONE mood from the list. Journal: " # journalContent;

        try {
            let rawJSON = await LLM.prompt(#Llama3_1_8B, prompt);
            return deserializeAnalysisJSON(rawJSON);
        } catch (_) {
            return ?{
                mood = "neutral";
                reflection = "Sorry, I could not analyze your journal.";
            };
        };
    };

    private func deserializeAnalysisJSON(
        analysisJSON : Text
    ) : ?Types.AnalysisResult {
        let parsed = JSON.fromText(analysisJSON, null);
        switch (parsed) {
            case (#ok(blob)) {
                let analysisResult : ?Types.AnalysisResult = from_candid (blob);
                return analysisResult;
            };
            case (#err(err)) {
                Debug.print("error: " # err);
                return null;
            };
        };
    };
};
