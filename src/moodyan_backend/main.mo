import LLM "mo:llm";
import JSON "mo:serde/JSON";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import { hashNat } "mo:map/Map";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";
import T "types";

actor {
  private stable var journalEntryId = 0;

  type UserJournal = HashMap.HashMap<Nat, T.Journal>;
  private var userJournals = HashMap.HashMap<Principal, UserJournal>(10, Principal.equal, Principal.hash);

  private func ensureUserJournalExists(user : Principal) {
    if (Option.isNull(userJournals.get(user))) {
      userJournals.put(
        user,
        HashMap.HashMap<Nat, T.Journal>(
          10,
          Nat.equal,
          hashNat,
        ),
      );
    };
  };

  public shared (msg) func createJournal(title : Text, content : Text) : async Result.Result<T.Journal, T.Error> {
    let caller = msg.caller;

    if (Text.size(title) == 0) {
      return #err(#InvalidInput);
    };

    if (Text.size(content) == 0) {
      return #err(#InvalidInput);
    };

    ensureUserJournalExists(caller);

    let timestamp = Time.now();

    let journal : T.Journal = {
      title = title;
      content = content;
      createdAt = timestamp;
      updatedAt = timestamp;
      mood = null;
      reflection = null;
    };

    journalEntryId += 1;
    switch (userJournals.get(caller)) {
      case (?userJournal) {
        userJournal.put(journalEntryId, journal);
        return #ok(journal);
      };
      case (_) {
        return #err(#NotFound);
      };
    };
  };

  public query (msg) func findAllJournals() : async [T.Journal] {
    let caller = msg.caller;

    switch (userJournals.get(caller)) {
      case (null) {
        return [];
      };
      case (?userJournalMap) {
        let entriesBuffer = Buffer.Buffer<T.Journal>(userJournalMap.size());
        for ((_, entry) in userJournalMap.entries()) {
          entriesBuffer.add(entry);
        };
        return Buffer.toArray(entriesBuffer);
      };
    };
  };

  private func deserializeAnalysisJSON(json : Text) : async ?T.AnalysisResult {
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

  private func analyzeJournal(journalContent : Text) : async Text {
    let prompt = "You are a compassionate psychologist. Analyze journal and reply ONLY with JSON: {\"mood\": \"happy|sad|angry|anxious|exhausted|neutral\", \"reflection\": \"personal, empathetic, and supportive message\"}. Choose only ONE mood from the list. Journal: " # journalContent;

    try {
      let rawJSON = await LLM.prompt(#Llama3_1_8B, prompt);
      return rawJSON;
    } catch (_) {
      return "{\"mood\": \"neutral\", \"reflection\": \"Sorry, I could not analyze your journal. I hope you have a good day!\"}";
    };
  };
};
