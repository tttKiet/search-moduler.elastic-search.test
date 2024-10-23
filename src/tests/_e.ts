import { faker } from "@faker-js/faker";
import { Metadata } from "@grpc/grpc-js";
import {
  SearchUserResult,
  SearchUsersRequest,
  SendDMMessageRequest,
} from "@halomeapis/halome-proto-files";
import { randomInt } from "crypto";
import { ulid } from "ulid";

import {
  acceptFriendRequest,
  addFriend,
} from "../../helpers/chat-media/friend-service";
import {
  getRandomEmotions,
  sendDmMessage,
} from "../../helpers/chat-media/message-service";
import { mockUsers } from "../../helpers/faker/faker-service";
import {
  checkSearchPagination,
  pollForExpectedSearchResult,
  removeAccents,
  searchUsers,
} from "../../helpers/search/search-service";
import { randomSpecialCharacters } from "../../helpers/shared/common";
import { wait } from "../../helpers/shared/sync";
import { updateUserDisplayName } from "../../helpers/user/user-profile-service";
import { getMe } from "../../helpers/user/user-view-service";
import { Accents, ZIICHAT_BOT_USERID, ZIICHAT_BOT_USERNAME } from "../const";
import {
  BOTH_PAGE_TOKEN_ERRORS,
  INVALID_ARGUMENT,
  KEYWORD_ERRORS,
  LIMIT_ERRORS,
  NEXT_PAGE_TOKEN_SEARCH_ERRORS,
  NULL_UNDEFINED_ERROR,
  PREV_PAGE_TOKEN_SEARCH_ERRORS,
} from "../error-message";
import { getPrefixMockUser } from "../jest-e2e";

describe("SEARCH_USERS", () => {
  const UPPERCASE_NOT_ACCENTS_KEYWORD = "LY THUONG KIET";
  const UPPERCASE_WITH_ACCENTS_KEYWORD = "CHÂU VĂN LIÊM";
  const LOWERCASE_NOT_ACCENTS_KEYWORD = "phan boi chau";
  const LOWERCASE_WITH_ACCENTS_KEYWORD = "ngô quyền";
  const SPECIAL_CHARACTER_KEYWORD = "user_name.test";
  const CHARACTER_KEYWORD = faker.string.alpha(5);
  const NUMBER_KEYWORD = randomInt(10000, 900000).toString();
  const PAGINATION_KEYWORD = "Pagination_Cases_Users";

  let sender;
  let receiver;
  let metadataSender;
  let metadataReceiver;
  let listUsers;
  const listDataSearch: SearchUserResult[] = [];
  const prefix = getPrefixMockUser() + "SEARCH_USERS_";
  const quantity = 15;
  const limit = 3;

  const listName = [
    UPPERCASE_NOT_ACCENTS_KEYWORD,
    UPPERCASE_WITH_ACCENTS_KEYWORD,
    LOWERCASE_NOT_ACCENTS_KEYWORD,
    LOWERCASE_WITH_ACCENTS_KEYWORD,
    CHARACTER_KEYWORD,
    SPECIAL_CHARACTER_KEYWORD,
    NUMBER_KEYWORD,
    removeAccents(UPPERCASE_WITH_ACCENTS_KEYWORD, Accents.NO_ACCENTS),
    removeAccents(LOWERCASE_WITH_ACCENTS_KEYWORD, Accents.NO_ACCENTS),
    "châu chấu",
    "truong hoc phan boi chau",
    "tran chau",
    "ly tu trong",
    "ngô đồng",
    "quyền lực",
    "truong hoc ngo quyen",
    "hào kiệt",
    "lý thường kiệt",
    "viet quoc cong ly thuong kiet",
    "thanh liêm",
    "thpt chau van liem",
    "phan bội châu",
    "vua ngô quyền",
    "Ngô Đình Diệm",
    "Diễm My",
    "Mỹ Đạt",
  ];
  const listSpecialCharacter = [
    "!",
    "@",
    "#",
    "$",
    "%",
    "&",
    "*",
    "=",
    "_",
    randomSpecialCharacters(1),
  ];

  beforeAll(async () => {
    await createListUser();

    for (const name of listName) {
      const response = await createUser(name);
      listDataSearch.push(response);
    }
    const listDataPagination = await mockUsers({
      prefix: getPrefixMockUser() + PAGINATION_KEYWORD,
      quantity: quantity,
    });
    if (listDataPagination instanceof Error) throw listDataPagination;
    if (!listDataPagination.data) throw new Error(NULL_UNDEFINED_ERROR);
    expect(listDataPagination.ok).toBe(true);
    expect(listDataPagination.error).toBeUndefined();
    expect(listDataPagination.data.length).toEqual(quantity);

    await wait(5000); //sync
  }, 100000);

  async function createListUser() {
    listUsers = await mockUsers({
      prefix: prefix,
      quantity: 2,
    });
    if (listUsers instanceof Error) throw listUsers;
    expect(listUsers.ok).toBe(true);
    expect(listUsers.error).toBeUndefined();
    listUsers = listUsers.data;
    [sender, receiver] = listUsers;

    metadataSender = new Metadata();
    metadataSender.set("x-session-token", sender.token);
    metadataReceiver = new Metadata();
    metadataReceiver.set("x-session-token", receiver.token);

    //Update display name
    const updateDisplayName = await updateUserDisplayName(
      { displayName: UPPERCASE_NOT_ACCENTS_KEYWORD },
      metadataReceiver
    );
    if (updateDisplayName instanceof Error) throw updateDisplayName;
    expect(updateDisplayName.ok).toBe(true);
    expect(updateDisplayName.error).toBeUndefined();
  }

  async function createUser(name) {
    const response = await mockUsers({
      prefix: getPrefixMockUser() + name,
      quantity: 1,
    });
    if (response instanceof Error) throw response;
    if (!response.data || !response.data[0].token)
      throw new Error(NULL_UNDEFINED_ERROR);
    expect(response.ok).toBe(true);
    expect(response.error).toBeUndefined();

    const metadata = new Metadata();
    metadata.set("x-session-token", response.data[0].token);

    await wait();
    //Update display name
    const updateDisplayName = await updateUserDisplayName(
      { displayName: name },
      metadata
    );
    if (updateDisplayName instanceof Error) throw updateDisplayName;
    expect(updateDisplayName.ok).toBe(true);
    expect(updateDisplayName.error).toBeUndefined();

    const getInfo = await getMe({}, metadata);
    if (getInfo instanceof Error) throw getInfo;
    if (!getInfo.data || !getInfo.data.profile)
      throw new Error(NULL_UNDEFINED_ERROR);
    expect(getInfo.ok).toBe(true);
    expect(getInfo.error).toBeUndefined();

    return {
      userId: getInfo.data.userId,
      displayName: getInfo.data.profile.displayName,
      username: getInfo.data.username,
      avatar: getInfo.data.profile.avatar,
    };
  }

  async function expectedSearchResult(
    request: SearchUsersRequest,
    expectedQuantity: number,
    accent: Accents = Accents.TONE_AND_DIACRITICAL_MARK
  ) {
    const searchResult = await pollForExpectedSearchResult(
      request,
      accent,
      expectedQuantity,
      metadataSender,
      searchUsers
    );

    expect(searchResult).not.toBeNull();
    if (!searchResult) throw new Error(NULL_UNDEFINED_ERROR);
    const userInList = (searchResult as SearchUserResult[]).filter(
      (valueSearch) =>
        listDataSearch.some((value) => value.userId === valueSearch.userId)
    );
    expect(userInList.length).toBeGreaterThanOrEqual(expectedQuantity);
  }

  describe("Validate", () => {
    const expectedResponseError = {
      details: [] as string[],
      code: 1000,
      message: INVALID_ARGUMENT,
    };
    it("should return error with limit exceed 500", async () => {
      expectedResponseError.details = [LIMIT_ERRORS[0]];
      const response = await searchUsers(
        { limit: faker.number.int({ min: 501 }), keyword: "123" },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    it("should return error with limit equal 0", async () => {
      expectedResponseError.details = LIMIT_ERRORS;
      const response = await searchUsers(
        { limit: 0, keyword: "123" },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    it("should return error with limit is negative number", async () => {
      expectedResponseError.details = [LIMIT_ERRORS[0]];
      const response = await searchUsers(
        {
          limit: faker.number.int({ min: -100, max: 0 }),
          keyword: "123",
        },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });

    it("should return error without keyword", async () => {
      expectedResponseError.details = KEYWORD_ERRORS;
      const response = await searchUsers({}, metadataSender);
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    for (const value of [null, undefined, ""]) {
      const isEmpty = typeof value === "string" && value.length === 0;
      const title = isEmpty ? "empty" : value;
      it("should return error with keyword is " + title, async () => {
        expectedResponseError.details = isEmpty
          ? [KEYWORD_ERRORS[0]]
          : KEYWORD_ERRORS;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const response = await searchUsers({ keyword: value }, metadataSender);
        if (response instanceof Error) throw response;
        expect(response.ok).toBe(false);
        expect(response.data).toBeUndefined();
        expect(response.error).toEqual(expectedResponseError);
      });
    }

    it("should return error with next_page_token is empty", async () => {
      expectedResponseError.details = NEXT_PAGE_TOKEN_SEARCH_ERRORS;
      const response = await searchUsers(
        { nextPageToken: "", keyword: "123" },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    it("should return error with invalid next_page_token", async () => {
      expectedResponseError.details = NEXT_PAGE_TOKEN_SEARCH_ERRORS;
      const response = await searchUsers(
        { nextPageToken: ulid(), keyword: "123" },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    it("should return error with next_page_token exceed 10000 items", async () => {
      expectedResponseError.details = [NEXT_PAGE_TOKEN_SEARCH_ERRORS[0]];
      const response = await searchUsers(
        {
          nextPageToken: faker.number.int({ min: 10001 }).toString(),
          keyword: "123",
        },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });

    it("should return error with prev_page_token is empty", async () => {
      expectedResponseError.details = PREV_PAGE_TOKEN_SEARCH_ERRORS;
      const response = await searchUsers(
        { prevPageToken: "", keyword: "123" },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    it("should return error with invalid prev_page_token", async () => {
      expectedResponseError.details = PREV_PAGE_TOKEN_SEARCH_ERRORS;
      const response = await searchUsers(
        { prevPageToken: ulid(), keyword: "123" },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    it("should return error with prev_page_token exceed 10000 items", async () => {
      expectedResponseError.details = [PREV_PAGE_TOKEN_SEARCH_ERRORS[0]];
      const response = await searchUsers(
        {
          prevPageToken: faker.number.int({ min: 10001 }).toString(),
          keyword: "123",
        },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
    it("should return error with next_page_token, prev_page_token at the same time", async () => {
      expectedResponseError.details = BOTH_PAGE_TOKEN_ERRORS;
      const response = await searchUsers(
        {
          nextPageToken: "1",
          prevPageToken: "1",
          keyword: "123",
        },
        metadataSender
      );
      if (response instanceof Error) throw response;
      expect(response.ok).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toEqual(expectedResponseError);
    });
  });
  describe("Business", () => {
    it("should return error when key contain only spaces", async () => {
      const expectedResponseError = {
        details: [KEYWORD_ERRORS[0]],
        code: 1000,
        message: INVALID_ARGUMENT,
      };
      const search = await searchUsers({ keyword: "     " }, metadataSender);
      if (search instanceof Error) throw search;
      expect(search.ok).toBe(false);
      expect(search.data).toBeUndefined();
      expect(search.error).toEqual(expectedResponseError);
    });
    it("should return data when keyword is character", async () => {
      await expectedSearchResult({ keyword: CHARACTER_KEYWORD }, 1);
    });
    it("should return data when keyword is number", async () => {
      await expectedSearchResult({ keyword: NUMBER_KEYWORD }, 1);
    });
    it("should return data when search username contain special character", async () => {
      await expectedSearchResult({ keyword: SPECIAL_CHARACTER_KEYWORD }, 1);
    });
    it("should return data when search display name contain special character", async () => {
      //Prepare data
      const displayName = prefix + randomSpecialCharacters(1);

      const response = await mockUsers({
        prefix: prefix,
        quantity: 1,
      });
      if (response instanceof Error) throw response;
      if (!response.data || !response.data[0].token)
        throw new Error(NULL_UNDEFINED_ERROR);
      expect(response.ok).toBe(true);
      expect(response.error).toBeUndefined();

      const metadata = new Metadata();
      metadata.set("x-session-token", response.data[0].token);

      //Update display name
      const updateDisplayName = await updateUserDisplayName(
        { displayName: displayName },
        metadata
      );
      if (updateDisplayName instanceof Error) throw updateDisplayName;
      expect(updateDisplayName.ok).toBe(true);
      expect(updateDisplayName.error).toBeUndefined();

      await wait(14000); //wait for sync
      //Search
      const search = await searchUsers(
        { keyword: displayName },
        metadataSender
      );
      if (search instanceof Error) throw search;
      if (!search.data) throw new Error(NULL_UNDEFINED_ERROR);
      expect(search.ok).toBe(true);
      expect(search.error).toBeUndefined();
      expect(search.data.length).toBeGreaterThanOrEqual(1);

      for (const user of search.data) {
        expect(user.displayName).toContain(displayName);
      }
    });
    it("should return data when search display name contain emoji", async () => {
      //Prepare data
      const displayName = prefix + getRandomEmotions()[0];

      const response = await mockUsers({
        prefix: prefix,
        quantity: 1,
      });
      if (response instanceof Error) throw response;
      if (!response.data || !response.data[0].token)
        throw new Error(NULL_UNDEFINED_ERROR);
      expect(response.ok).toBe(true);
      expect(response.error).toBeUndefined();

      const metadata = new Metadata();
      metadata.set("x-session-token", response.data[0].token);

      //Update display name
      const updateDisplayName = await updateUserDisplayName(
        { displayName: displayName },
        metadata
      );
      if (updateDisplayName instanceof Error) throw updateDisplayName;
      expect(updateDisplayName.ok).toBe(true);
      expect(updateDisplayName.error).toBeUndefined();

      await wait(14000); //wait for sync
      //Search
      const search = await searchUsers(
        { keyword: displayName },
        metadataSender
      );
      if (search instanceof Error) throw search;
      if (!search.data) throw new Error(NULL_UNDEFINED_ERROR);
      expect(search.ok).toBe(true);
      expect(search.error).toBeUndefined();
      expect(search.data.length).toBeGreaterThanOrEqual(1);

      for (const user of search.data) {
        expect(user.displayName).toContain(displayName);
      }
    });
    for (const key of listSpecialCharacter) {
      it(
        "should return true when keyword is a special character: " + key,
        async () => {
          const search = await searchUsers({ keyword: key }, metadataSender);
          if (search instanceof Error) throw search;
          expect(search.ok).toBe(true);
          expect(search.error).toBeUndefined();

          const option = Accents.TONE_AND_DIACRITICAL_MARK;

          if (search.data) {
            for (const user of search.data) {
              if (!user.username) throw new Error(NULL_UNDEFINED_ERROR);
              const username = removeAccents(
                user.username.toLowerCase(),
                option
              );

              const displayName = user.displayName
                ? removeAccents(user.displayName.toLowerCase(), option)
                : "";

              const isMatch =
                username.indexOf(key) !== -1 || displayName.indexOf(key) !== -1;

              expect(isMatch).toBeTruthy();
            }
          } else {
            expect(search.data).toBeUndefined();
          }
        }
      );
    }
    it("should return data when keyword is uppercase (not accents)", async () => {
      //Result: LY THUONG KIET, lý thường kiệt, viet quoc cong ly thuong kiet
      await expectedSearchResult(
        { limit: 100, keyword: UPPERCASE_NOT_ACCENTS_KEYWORD },
        3,
        Accents.NO_ACCENTS
      );
    });
    //TODO: https://github.com/halonext/ziichat-issues/issues/1219
    it.skip("should return data when keyword is uppercase (with accents)", async () => {
      //Result: CHÂU VĂN LIÊM
      await expectedSearchResult(
        { limit: 5, keyword: UPPERCASE_WITH_ACCENTS_KEYWORD },
        1
      );
    });

    it("should return data when keyword is lowercase (not accents)", async () => {
      //Result: phan boi chau, truong hoc phan boi chau, phan bội châu
      await expectedSearchResult(
        { limit: 5, keyword: LOWERCASE_NOT_ACCENTS_KEYWORD },
        3,
        Accents.NO_ACCENTS
      );
    });
    //TODO: https://github.com/halonext/ziichat-issues/issues/1219
    it.skip("should return data when keyword is lowercase (with accents)", async () => {
      //Result: ngô quyền, vua ngô quyền
      await expectedSearchResult(
        { keyword: LOWERCASE_WITH_ACCENTS_KEYWORD },
        2
      );
    });

    it("should return data when keyword is removed accent", async () => {
      //Result: Diễm My, Ngô Đình Diệm
      await expectedSearchResult({ keyword: "diêm" }, 2, Accents.TONE_MARK);
    });

    // TODO https://github.com/halonext/ziichat-issues/issues/1273#issuecomment-2367464475
    it.skip('should return data when keyword is removed stroke of "d"', async () => {
      //Result: Mỹ Đạt
      await expectedSearchResult(
        { keyword: "dạt" },
        1,
        Accents.REPLACE_D_WITH_STROKE
      );
    });

    it("should return data when search bot channel", async () => {
      const response = await searchUsers(
        { keyword: ZIICHAT_BOT_USERNAME },
        metadataSender
      );
      if (response instanceof Error) throw response;
      if (!response.data) throw new Error(NULL_UNDEFINED_ERROR);
      expect(response.ok).toBe(true);
      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      const hasUserInResponse = response.data.some(
        (user) => user.userId === ZIICHAT_BOT_USERID
      );
      expect(hasUserInResponse).toEqual(true);
    });
    it("should sort the most recent channel > friend > stranger in search result", async () => {
      //Add friend
      const addFr = await addFriend(
        { userId: receiver.userId },
        metadataSender
      );
      if (addFr instanceof Error) throw addFr;
      expect(addFr.ok).toBe(true);
      expect(addFr.error).toBeUndefined();

      //Accept friend
      const accept = await acceptFriendRequest(
        { userId: sender.userId },
        metadataReceiver
      );
      if (accept instanceof Error) throw accept;
      expect(accept.ok).toBe(true);
      expect(accept.error).toBeUndefined();

      //Send new message
      const request: SendDMMessageRequest = {
        content: "Hello",
        ref: "1",
        userId: listDataSearch[0].userId,
      };
      const msgInfo = await sendDmMessage(request, metadataSender);
      if (msgInfo instanceof Error) throw msgInfo;
      expect(msgInfo.ok).toBe(true);
      expect(msgInfo.error).toBeUndefined();

      //Search
      await wait(5000); //wait for sync
      const response = await searchUsers(
        { keyword: UPPERCASE_NOT_ACCENTS_KEYWORD },
        metadataSender
      );
      if (response instanceof Error) throw response;
      if (!response.data) throw new Error(NULL_UNDEFINED_ERROR);
      expect(response.ok).toBe(true);
      expect(response.error).toBeUndefined();
      expect(response.data[0].userId).toEqual(listDataSearch[0].userId);
      expect(response.data[1].userId).toEqual(receiver.userId);
    });

    //Skip because it takes a lot of time, so it needs to be run separately
    it.skip("should return 500 data with limit = 500", async () => {
      const keyword = "_SearchUsers_";
      for (let i = 0; i < 5; i++) {
        const users = await mockUsers({
          prefix: getPrefixMockUser() + keyword,
          quantity: 100,
        });
        if (users instanceof Error) throw users;
        if (!users.data) throw new Error(NULL_UNDEFINED_ERROR);
        expect(users.ok).toBe(true);
        expect(users.error).toBeUndefined();
        expect(users.data.length).toEqual(100);
      }

      //Search User
      const searchResponse = await searchUsers(
        { keyword: keyword, limit: 500 },
        metadataSender
      );
      if (searchResponse instanceof Error) throw searchResponse;
      if (!searchResponse.data) throw new Error(NULL_UNDEFINED_ERROR);
      expect(searchResponse.ok).toBe(true);
      expect(searchResponse.error).toBeUndefined();
      expect(searchResponse.data.length).toEqual(500);
    }, 100000);

    describe("Pagination", () => {
      it("should return correct data quantity when limit < records (records % limit = 0)", async () => {
        const keyword = PAGINATION_KEYWORD;

        //Check pagination
        const originalList = await searchUsers(
          { keyword: keyword },
          metadataSender
        );
        if (originalList instanceof Error) throw originalList;
        if (!originalList.data) throw new Error(NULL_UNDEFINED_ERROR);
        expect(originalList.ok).toBe(true);
        expect(originalList.error).toBeUndefined();
        expect(originalList.data.length).toEqual(quantity);

        await checkSearchPagination({
          fetchList: searchUsers,
          metadata: metadataSender,
          options: { quantity: quantity, limit: limit, keyword: keyword },
          originalList: originalList.data,
        });
      });
      it("should return correct data quantity when limit < records (records % limit != 0)", async () => {
        const keyword = PAGINATION_KEYWORD;

        //Check pagination
        const originalList = await searchUsers(
          { keyword: keyword },
          metadataSender
        );
        if (originalList instanceof Error) throw originalList;
        if (!originalList.data) throw new Error(NULL_UNDEFINED_ERROR);
        expect(originalList.ok).toBe(true);
        expect(originalList.error).toBeUndefined();
        expect(originalList.data.length).toEqual(quantity);

        await checkSearchPagination({
          fetchList: searchUsers,
          metadata: metadataSender,
          options: { quantity: quantity, limit: limit + 1, keyword: keyword },
          originalList: originalList.data,
        });
      });
      it("should return correct data quantity with limit = records", async () => {
        const keyword = PAGINATION_KEYWORD;

        //Search User
        const searchResponse = await searchUsers(
          { keyword: keyword, limit: quantity },
          metadataSender
        );
        if (searchResponse instanceof Error) throw searchResponse;
        if (!searchResponse.data) throw new Error(NULL_UNDEFINED_ERROR);
        expect(searchResponse.ok).toBe(true);
        expect(searchResponse.error).toBeUndefined();
        expect(searchResponse.data.length).toEqual(quantity);
      });
      it("should return correct data quantity with limit > records", async () => {
        //Create user
        const keyword = PAGINATION_KEYWORD;

        //Search User
        const searchResponse = await searchUsers(
          { keyword: keyword, limit: 100 },
          metadataSender
        );
        if (searchResponse instanceof Error) throw searchResponse;
        if (!searchResponse.data) throw new Error(NULL_UNDEFINED_ERROR);
        expect(searchResponse.ok).toBe(true);
        expect(searchResponse.error).toBeUndefined();
        expect(searchResponse.data.length).toEqual(quantity);
      });
    });
  });
});
