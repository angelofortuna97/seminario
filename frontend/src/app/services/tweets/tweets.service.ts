import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Tweet, NewTweet } from 'src/app/interfaces/tweet';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TweetsService {

  comments = {} as Tweet;
  active: boolean = false;

  // Http Options
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    })
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // CREATE
  async createTweet(newTweet: NewTweet) {
    const headerOptions = this.httpOptions.headers.append('Authorization', `Bearer ${this.auth.userToken}`);
    return this.http.post<Tweet>(`${environment.API_URL}/tweets/`, newTweet, {
      headers: headerOptions
    }).toPromise();
  }

  //COMMENT
  async commentTweet(newTweet: NewTweet, parent: String) {

    this.comments.tweet = newTweet.tweet;
    this.comments._parent = parent;

    console.log("tweet: " + JSON.stringify(newTweet));
    console.log("comments: " + JSON.stringify(this.comments));

    const headerOptions = this.httpOptions.headers.append('Authorization', `Bearer ${this.auth.userToken}`);
    return this.http.post<Tweet>(`${environment.API_URL}/tweets/`, this.comments, {
      headers: headerOptions
    }).toPromise();
  }

  // READ
  async getTweets() {
    return this.http.get<Tweet[]>(`${environment.API_URL}/tweets`).toPromise();
  }

  // READ
  async getComments(id: string) {
    return this.http.get<Tweet[]>(`${environment.API_URL}/tweets/${id}/comments`).toPromise();
  }

  // UPDATE
  async editTweet(tweet: Tweet) {
    const headerOptions = this.httpOptions.headers.append('Authorization', `Bearer ${this.auth.userToken}`);
    return this.http.put<any>(`${environment.API_URL}/tweets/${tweet._id}`, tweet, {
      headers: headerOptions
    }).toPromise();
  }

  // DELETE
  async deleteTweet(tweetId: string) {
    const headerOptions = this.httpOptions.headers.append('Authorization', `Bearer ${this.auth.userToken}`);
    return this.http.delete<any>(`${environment.API_URL}/tweets/${tweetId}`, {
      headers: headerOptions
    }).toPromise();
  }

}
