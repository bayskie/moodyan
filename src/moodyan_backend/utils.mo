import Result "mo:base/Result";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Types "types";
import LLM "mo:llm";
import JSON "mo:serde/JSON";
import Array "mo:base/Array";

module {
    public func validateJournal(title : Text, content : Text) : Result.Result<Text, Types.Error> {
        if (Text.size(title) == 0) {
            return #err(#InvalidInput("Journal title cannot be empty"));
        };
        if (Text.size(content) == 0) {
            return #err(#InvalidInput("Journal content cannot be empty"));
        };
        if (Text.size(title) > 100) {
            return #err(#InvalidInput("Journal title too long (max 100 characters)"));
        };
        if (Text.size(content) > 1000) {
            return #err(#InvalidInput("Journal content too long (max 1000 characters)"));
        };
        return #ok("Journal validated successfully");
    };

    public func analyzeJournal(journalContent : Text) : async ?Types.AnalysisResult {
        let prompt = "You are a compassionate psychologist with expertise in emotional analysis. Your task is to analyze the following journal entry for emotional tone, sentiment, and context. Identify the dominant mood from this list: happy, sad, angry, anxious, exhausted, or neutral (choose only ONE). Provide a detailed, empathetic, and supportive reflection that acknowledges the user's emotions, offers insights, and suggests a positive action they can take. Reply ONLY with JSON in this format: {\"mood\": \"happy|sad|angry|anxious|exhausted|neutral\", \"reflection\": \"personal, empathetic, and supportive message with a positive suggestion\"}. Use these guidelines:\n" #
            "- Prioritize emotional keywords (e.g., 'joyful', 'sad', 'frustrated', 'nervous', 'tired', 'calm') based on their frequency and intensity (e.g., 'happy happy happy' strongly indicates 'happy').\n" #
            "- Assess overall sentiment (positive, negative, or neutral) by weighting repeated keywords highest.\n" #
            "- Consider context (e.g., events or experiences mentioned) to confirm the dominant mood.\n" #
            "- If multiple emotions are present, select the most dominant based on frequency, intensity, and context.\n" #
            "- For the reflection, validate the user’s feelings, provide insight, and suggest a practical, uplifting action.\n" #
            "Journal Entry: " # journalContent;

        try {
            let rawJSON = await LLM.prompt(#Llama3_1_8B, prompt);
            Debug.print("Raw LLM response: " # rawJSON);
            let analysisResult = deserializeAnalysisJSON(rawJSON);

            switch (analysisResult) {
                case (?result) {
                    let validMoods = ["happy", "sad", "angry", "anxious", "exhausted", "neutral"];
                    if (Array.find<Text>(validMoods, func(m) { m == result.mood }) == null) {
                        Debug.print("Invalid mood detected: " # result.mood);
                        return ?{
                            mood = "neutral";
                            reflection = "I noticed some mixed emotions in your journal. Let's explore them further—maybe try writing about one specific feeling to gain more clarity.";
                        };
                    };
                    return analysisResult;
                };
                case (null) {
                    Debug.print("Failed to deserialize JSON: " # rawJSON);
                    return ?{
                        mood = "neutral";
                        reflection = "I had trouble understanding your emotions this time. Perhaps try sharing a bit more about how you're feeling, and we can explore it together.";
                    };
                };
            };
        } catch (_error) {
            Debug.print("LLM error occurred: ");
            return ?{
                mood = "neutral";
                reflection = "I'm sorry, I couldn't analyze your journal right now. Maybe take a moment to reflect on your thoughts and try again.";
            };
        };
    };

    private func deserializeAnalysisJSON(analysisJSON : Text) : ?Types.AnalysisResult {
        let parsed = JSON.fromText(analysisJSON, null);
        switch (parsed) {
            case (#ok(blob)) {
                let analysisResult : ?Types.AnalysisResult = from_candid(blob);
                return analysisResult;
            };
            case (#err(err)) {
                Debug.print("JSON parsing error: " # err);
                return null;
            };
        };
    };

    public func toEpochDay(timestamp : Time.Time) : Time.Time {
        let nanosecondsInOneDay = 86_400 * 1_000_000_000;
        return timestamp / nanosecondsInOneDay;
    };
};