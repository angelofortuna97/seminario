import { User } from './user';

export interface NewTweet {
    tweet: string;
}

export interface Tweet {
    created_at: string;
    _id: string;
    tweet: string;
    _author: User;
    _parent: String;
    _likes: Array<string>;
    count_likes: Number;
}
