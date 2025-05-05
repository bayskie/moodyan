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
import Option "mo:base/Option";
import Iter "mo:base/Iter";
import Types "types";

actor {
  private stable var journalEntryId = 0;

  type UserJournal = HashMap.HashMap<Nat, Types.Journal>;
  private var userJournals = HashMap.HashMap<Principal, UserJournal>(10, Principal.equal, Principal.hash);

  private func ensureUserJournalExists(user : Principal) {
    if (Option.isNull(userJournals.get(user))) {
      userJournals.put(
        user,
        HashMap.HashMap<Nat, Types.Journal>(
          10,
          Nat.equal,
          hashNat,
        ),
      );
    };
  };

  private func validateJournal(title : Text, content : Text) : Result.Result<Text, Types.Error> {
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

  public shared ({ caller }) func createJournal(
    title : Text,
    content : Text,
  ) : async Result.Result<Types.Journal, Types.Error> {
    ensureUserJournalExists(caller);

    let validationResult = validateJournal(title, content);
    switch (validationResult) {
      case (#ok(_)) {};
      case (#err(error)) return #err(error);
    };

    let timestamp = Time.now();
    journalEntryId += 1;

    let baseJournal = {
      id = journalEntryId;
      title = title;
      content = content;
      createdAt = timestamp;
      updatedAt = timestamp;
      mood = ?"";
      reflection = ?"";
    };

    let analysisResult : ?Types.AnalysisResult = await analyzeJournal(content);

    let journal = switch (analysisResult) {
      case (?analysisResultValue) {
        {
          baseJournal with
          mood = ?analysisResultValue.mood;
          reflection = ?analysisResultValue.reflection;
        };
      };
      case (null) baseJournal;
    };

    switch (userJournals.get(caller)) {
      case (?userJournal) {
        userJournal.put(journalEntryId, journal);
        return #ok(journal);
      };
      case (_) {
        return #err(#NotFound("User journal was not found"));
      };
    };
  };

  public query ({ caller }) func findAllJournals() : async [Types.Journal] {
    switch (userJournals.get(caller)) {
      case (null) {
        return [];
      };
      case (?userJournalMap) {
        return Iter.toArray(
          Iter.map(
            userJournalMap.entries(),
            func((_, journal) : (Nat, Types.Journal)) : Types.Journal {
              return journal;
            },
          )
        );
      };
    };
  };

  public query ({ caller }) func findJournalById(id : Nat) : async ?Types.Journal {
    switch (userJournals.get(caller)) {
      case (null) {
        return null;
      };
      case (?userJournalMap) {
        return userJournalMap.get(id);
      };
    };
  };

  public shared ({ caller }) func updateJournalById(
    id : Nat,
    title : Text,
    content : Text,
  ) : async Result.Result<Types.Journal, Types.Error> {
    ensureUserJournalExists(caller);

    let validationResult = validateJournal(title, content);
    switch (validationResult) {
      case (#ok(_)) {};
      case (#err(error)) return #err(error);
    };

    let existingJournal : ?Types.Journal = await findJournalById(id);
    switch (existingJournal) {
      case (null) {
        return #err(#NotFound("Journal was not found"));
      };
      case (?existingJournal) {
        let updatedJournal : Types.Journal = {
          id = existingJournal.id;
          title = title;
          content = content;
          mood = existingJournal.mood;
          reflection = existingJournal.reflection;
          createdAt = existingJournal.createdAt;
          updatedAt = Time.now();
        };

        switch (userJournals.get(caller)) {
          case (?userJournal) {
            userJournal.put(id, updatedJournal);
            return #ok(updatedJournal);
          };
          case (_) {
            return #err(#NotFound("User journal was not found"));
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteJournalById(id : Nat) : async Result.Result<Types.Journal, Types.Error> {
    switch (userJournals.get(caller)) {
      case (null) {
        return #err(#NotFound("User journal was not found"));
      };
      case (?userJournalMap) {
        let journal : ?Types.Journal = userJournalMap.get(id);
        switch (journal) {
          case (null) {
            return #err(#NotFound("Journal was not found"));
          };
          case (?journal) {
            userJournalMap.delete(id);
            return #ok(journal);
          };
        };
      };
    };
  };

  private func deserializeAnalysisJSON(json : Text) : ?Types.AnalysisResult {
    let parsed = JSON.fromText(json, null);
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

  private func analyzeJournal(journalContent : Text) : async ?Types.AnalysisResult {
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
};
