/**
 * 用户数据
 */

export class UserData {

    private _userId: string = "";
    public get userId(): string { return this._userId; }

    private _userName: string = "";
    public get userName(): string { return this._userName; }
}

// 自己的用户数据
export const myUserData = new UserData();