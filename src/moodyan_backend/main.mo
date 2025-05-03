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

  private shared func ensureUserJournalExists(user : Principal) {
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

  public shared ({ caller }) func createJournal(title : Text, content : Text) : async Result.Result<Types.Journal, Types.Error> {
    if (Text.size(title) == 0) {
      return #err(#InvalidInput("Journal title cannot be empty"));
    };

    if (Text.size(content) == 0) {
      return #err(#InvalidInput("Journal content cannot be empty"));
    };

    ensureUserJournalExists(caller);

    let timestamp = Time.now();
    journalEntryId += 1;

    let journal : Types.Journal = {
      id = journalEntryId;
      title;
      content;
      createdAt = timestamp;
      updatedAt = timestamp;
      mood = null;
      reflection = null;
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

  public shared ({ caller }) func updateJournalById(id : Nat, title : Text, content : Text) : async Result.Result<Types.Journal, Types.Error> {
    if (Text.size(title) == 0) {
      return #err(#InvalidInput("Journal title cannot be empty"));
    };

    if (Text.size(content) == 0) {
      return #err(#InvalidInput("Journal content cannot be empty"));
    };

    ensureUserJournalExists(caller);

    let existingJournal : ?Types.Journal = await findJournalById(id);
    switch (existingJournal) {
      case (null) {
        return #err(#NotFound("Journal was not found"));
      };
      case (?existingJournal) {
        let updatedJournal : Types.Journal = {
          id = existingJournal.id;
          title;
          content;
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

  private func deserializeAnalysisJSON(json : Text) : async ?Types.AnalysisResult {
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
