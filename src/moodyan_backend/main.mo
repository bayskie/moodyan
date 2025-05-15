import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import { hashNat } "mo:map/Map";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Types "types";
import Utils "utils";

actor {
  private stable var journalEntryId = 0;

  type UserJournal = HashMap.HashMap<Nat, Types.Journal>;
  type UserAchievement = HashMap.HashMap<Text, Types.Achievement>;

  private var userJournals = HashMap.HashMap<Principal, UserJournal>(10, Principal.equal, Principal.hash);
  private var userAchievements = HashMap.HashMap<Principal, UserAchievement>(10, Principal.equal, Principal.hash);
  private var userProfiles = HashMap.HashMap<Principal, Types.UserProfile>(10, Principal.equal, Principal.hash);

  public shared ({ caller }) func saveNickname(nickname : Text) : async Result.Result<(), Types.Error> {
    if (Text.size(nickname) == 0) {
      return #err(#InvalidInput("Nickname cannot be empty"));
    };
    if (Text.size(nickname) > 32) {
      return #err(#InvalidInput("Nickname too long (max 32 characters)"));
    };

    let profile : Types.UserProfile = {
      nickname = nickname;
      createdAt = Time.now();
    };

    userProfiles.put(caller, profile);
    #ok(());
  };

  public query ({ caller }) func getNickname() : async Result.Result<Text, Types.Error> {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        #ok(profile.nickname);
      };
      case (null) {
        #err(#NotFound("Nickname not set"));
      };
    };
  };

  // public query func helloWorld() : async Text {
  //   return "Hello world!";
  // };

  public query ({ caller }) func whoami() : async Principal {
    return caller;
  };

  public shared ({ caller }) func createJournal(title : Text, content : Text) : async Result.Result<Types.Journal, Types.Error> {
    ensureUserJournalExists(caller);

    let validationResult = Utils.validateJournal(title, content);
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

    let analysisResult : ?Types.AnalysisResult = await Utils.analyzeJournal(content);
    Debug.print("Analysis Result: " # debug_show (analysisResult));

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

    return withUserJournal<Types.Journal>(
      caller,
      #err(#NotFound("User journal was not found")),
      func(userJournal) {
        userJournal.put(journalEntryId, journal);
        checkAchievements(caller);
        return #ok(journal);
      },
    );
  };

  private func findUserJournalById(user : Principal, id : Nat) : Result.Result<Types.Journal, Types.Error> {
    return withUserJournalQuery<Result.Result<Types.Journal, Types.Error>>(
      user,
      #err(#NotFound("User journal not found")),
      func(userJournalMap) {
        return switch (userJournalMap.get(id)) {
          case (null) {
            #err(#NotFound("Journal with id " # Nat.toText(id) # " was not found"));
          };
          case (?journal) { #ok(journal) };
        };
      },
    );
  };

  // public query ({ caller }) func findAllJournals(moodFilter : ?Text, dateFilter : ?Time.Time) : async [Types.Journal] {
  //   return withUserJournalQuery<[Types.Journal]>(
  //     caller,
  //     [],
  //     func(userJournalMap) {
  //       let allJournals = Iter.toArray(
  //         Iter.map(
  //           userJournalMap.entries(),
  //           func((_, journal) : (Nat, Types.Journal)) : Types.Journal {
  //             return journal;
  //           },
  //         )
  //       );

  //       let filteredJournals = Array.filter<Types.Journal>(
  //         allJournals,
  //         func(journal) {
  //           let matchesMood = switch (moodFilter) {
  //             case (null) { true };
  //             case (?mood) { journal.mood == ?mood };
  //           };

  //           let matchesDate = switch (dateFilter) {
  //             case (null) { true };
  //             case (?date) {
  //               Utils.toEpochDay(journal.createdAt) == Utils.toEpochDay(date);
  //             };
  //           };

  //           return matchesMood and matchesDate;
  //         },
  //       );

  //       Array.sort<Types.Journal>(
  //         filteredJournals,
  //         func(a, b) {
  //           Int.compare(b.createdAt, a.createdAt);
  //         },
  //       );
  //     },
  //   );
  // };

  public query ({ caller }) func findAllJournals(moodFilter : ?Text, dateFilter : ?Time.Time) : async [Types.Journal] {
    return findAllUserJournals(caller, moodFilter, dateFilter);
  };

  // public query ({ caller }) func findJournalById(id : Nat) : async Result.Result<Types.Journal, Types.Error> {
  //   return _findJournalById(caller, id);
  // };

  public query ({ caller }) func findJournalById(id : Nat) : async Result.Result<Types.Journal, Types.Error> {
    return findUserJournalById(caller, id);
  };

  // public shared ({ caller }) func updateJournalById(id : Nat, title : Text, content : Text) : async Result.Result<Types.Journal, Types.Error> {
  //   let validationResult = Utils.validateJournal(title, content);
  //   switch (validationResult) {
  //     case (#ok(_)) {};
  //     case (#err(error)) return #err(error);
  //   };

  //   let isJournalExist = _findJournalById(caller, id);
  //   switch (isJournalExist) {
  //     case (#err(error)) return #err(error);
  //     case (#ok(existingJournal)) {
  //       let analysisResult : ?Types.AnalysisResult = await Utils.analyzeJournal(content);
  //       let updatedJournal : Types.Journal = {
  //         id = existingJournal.id;
  //         title = title;
  //         content = content;
  //         mood = switch (analysisResult) {
  //           case (?result) ?result.mood;
  //           case (null) ?"neutral";
  //         };
  //         reflection = switch (analysisResult) {
  //           case (?result) ?result.reflection;
  //           case (null) ?"Unable to analyze journal.";
  //         };
  //         createdAt = existingJournal.createdAt;
  //         updatedAt = Time.now();
  //       };

  //       return withUserJournal<Types.Journal>(
  //         caller,
  //         #err(#NotFound("User journal was not found")),
  //         func(userJournal) {
  //           userJournal.put(id, updatedJournal);
  //           return #ok(updatedJournal);
  //         },
  //       );
  //     };
  //   };
  // };

  public shared ({ caller }) func updateJournalById(id : Nat, title : Text, content : Text) : async Result.Result<Types.Journal, Types.Error> {
    let validationResult = Utils.validateJournal(title, content);
    switch (validationResult) {
      case (#ok(_)) {};
      case (#err(error)) return #err(error);
    };

    let isJournalExist = findUserJournalById(caller, id);
    switch (isJournalExist) {
      case (#err(error)) return #err(error);
      case (#ok(existingJournal)) {
        let updatedJournal : Types.Journal = {
          id = existingJournal.id;
          title = title;
          content = content;
          mood = existingJournal.mood;
          reflection = existingJournal.reflection;
          createdAt = existingJournal.createdAt;
          updatedAt = Time.now();
        };

        return withUserJournal<Types.Journal>(
          caller,
          #err(#NotFound("User journal was not found")),
          func(userJournal) {
            userJournal.put(id, updatedJournal);
            return #ok(updatedJournal);
          },
        );
      };
    };
  };

  public shared ({ caller }) func deleteJournalById(id : Nat) : async Result.Result<Types.Journal, Types.Error> {
    let isJournalExist = findUserJournalById(caller, id);
    switch (isJournalExist) {
      case (#err(error)) return #err(error);
      case (#ok(existingJournal)) {
        switch (userJournals.get(caller)) {
          case (?userJournal) {
            userJournal.delete(id);
            return #ok(existingJournal);
          };
          case (_) {
            return #err(#NotFound("User journal was not found"));
          };
        };
      };
    };
  };

  public query ({ caller }) func findAllAchievements() : async [Types.Achievement] {
    return findAllUserAchievements(caller);
  };

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

  private func ensureUserAchievementsExists(user : Principal) {
    if (Option.isNull(userAchievements.get(user))) {
      userAchievements.put(
        user,
        HashMap.HashMap<Text, Types.Achievement>(
          10,
          Text.equal,
          Text.hash,
        ),
      );
    };
  };

  private func withUserJournalQuery<R>(user : Principal, fallback : R, f : (UserJournal) -> R) : R {
    switch (userJournals.get(user)) {
      case (?userJournal) {
        return f(userJournal);
      };
      case (_) {
        return fallback;
      };
    };
  };

  private func withUserJournal<R>(user : Principal, fallback : Result.Result<R, Types.Error>, f : (UserJournal) -> Result.Result<R, Types.Error>) : Result.Result<R, Types.Error> {
    switch (userJournals.get(user)) {
      case (?userJournal) {
        return f(userJournal);
      };
      case (_) {
        return fallback;
      };
    };
  };

  private func withUserAchievementQuery<R>(user : Principal, fallback : R, f : (UserAchievement) -> R) : R {
    switch (userAchievements.get(user)) {
      case (?userAchievement) {
        return f(userAchievement);
      };
      case (_) {
        return fallback;
      };
    };
  };

  private func findAllUserJournals(user : Principal, moodFilter : ?Text, dateFilter : ?Time.Time) : [Types.Journal] {
    return withUserJournalQuery<[Types.Journal]>(
      user,
      [],
      func(userJournalMap) {
        let allJournals = Iter.toArray(
          Iter.map(
            userJournalMap.entries(),
            func((_, journal) : (Nat, Types.Journal)) : Types.Journal {
              return journal;
            },
          )
        );

        let filteredJournals = Array.filter<Types.Journal>(
          allJournals,
          func(journal) {
            let matchesMood = switch (moodFilter) {
              case (null) { true };
              case (?mood) { journal.mood == ?mood };
            };

            let matchesDate = switch (dateFilter) {
              case (null) { true };
              case (?date) {
                Utils.toEpochDay(journal.createdAt) == Utils.toEpochDay(date);
              };
            };

            return matchesMood and matchesDate;
          },
        );

        Array.sort<Types.Journal>(
          filteredJournals,
          func(a, b) {
            Int.compare(b.createdAt, a.createdAt);
          },
        );
      },
    );
  };

  private func findAllUserAchievements(user : Principal) : [Types.Achievement] {
    return withUserAchievementQuery<[Types.Achievement]>(
      user,
      [],
      func(userAchievementMap) {
        return Iter.toArray(
          Iter.map(
            userAchievementMap.entries(),
            func((_, achievement) : (Text, Types.Achievement)) : Types.Achievement {
              return achievement;
            },
          )
        );
      },
    );
  };

  private func createAchievement(user : Principal, achievement : Types.Achievement) {
    ensureUserAchievementsExists(user);

    switch (userAchievements.get(user)) {
      case (null) {};
      case (?userAchievement) {
        userAchievement.put(achievement.id, achievement);
        return;
      };
    };
  };

  private func checkAchievements(user : Principal) {
    ensureUserAchievementsExists(user);

    let userJournalsMap = findAllUserJournals(user, null, null);

    var achievement : ?Types.Achievement = null;

    // Streak Seeker (Achievement by journal count)
    let journalCount = Array.size(userJournalsMap);
    if (journalCount == 10) {
      achievement := ?{
        id = "streak-seeker-1";
        title = "Streak Seeker";
        description = "Congratulations! You have reached 10 journal entries!";
        level = 1;
        achievedAt = Time.now();
      };
    } else if (journalCount == 30) {
      achievement := ?{
        id = "streak-seeker-2";
        title = "Streak Seeker";
        description = "Congratulations! You have reached 30 journal entries!";
        level = 2;
        achievedAt = Time.now();
      };
    } else if (journalCount == 60) {
      achievement := ?{
        id = "streak-seeker-3";
        title = "Streak Seeker";
        description = "Congratulations! You have reached 60 journal entries!";
        level = 3;
        achievedAt = Time.now();
      };
    };

    switch (achievement) {
      case (?ach) {
        createAchievement(user, ach);
      };
      case (_) {};
    }

    // TODO: Add Master of Pages (Achievement by journal streak)
  };

  // private func _findJournalById(user : Principal, id : Nat) : Result.Result<Types.Journal, Types.Error> {
  //   return withUserJournalQuery<Result.Result<Types.Journal, Types.Error>>(
  //     user,
  //     #err(#NotFound("User journal not found")),
  //     func(userJournalMap) {
  //       return switch (userJournalMap.get(id)) {
  //         case (null) {
  //           #err(#NotFound("Journal with id " # Nat.toText(id) # " was not found"));
  //         };
  //         case (?journal) { #ok(journal) };
  //       };
  //     },
  //   );
  // };
};
