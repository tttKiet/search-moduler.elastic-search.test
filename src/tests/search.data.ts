import type { IUser } from "../handle/user.controller.ts";

const name = [
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

export const users_test: IUser[] = name.map((n) => ({
  profile: {
    displayName: n,
    avatar: "1",
    originalAvatar: "2",
  },
}));

// export const users_test: IUser[] = [
//   {
//     profile: {
//       displayName: "Bùi Tuấn Kiệt",
//       avatar: "1",
//       originalAvatar: "2",
//     },
//   },
//   {
//     profile: {
//       displayName: "Bui",
//       avatar: "1",
//       originalAvatar: "2",
//     },
//   },
//   {
//     profile: {
//       displayName: "Kiệt",
//       avatar: "13",
//       originalAvatar: "22",
//     },
//   },
//   {
//     profile: {
//       displayName: "Tuấn",
//       avatar: "144",
//       originalAvatar: "245",
//     },
//   },
//   {
//     profile: {
//       displayName: "Tuân",
//       avatar: "1",
//       originalAvatar: "2",
//     },
//   },
//   {
//     profile: {
//       displayName: "tuan",
//       avatar: "1",
//       originalAvatar: "2",
//     },
//   },
// ];
