import { Component, OnInit } from '@angular/core';
import { Tweet } from 'src/app/interfaces/tweet';
import { TweetsService } from 'src/app/services/tweets/tweets.service';
import { ModalController } from '@ionic/angular';
import { NewTweetPage } from '../new-tweet/new-tweet.page';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UniLoaderService } from 'src/app/shared/uniLoader.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ToastTypes } from 'src/app/enums/toast-types.enum';

@Component({
  selector: 'app-tweets',
  templateUrl: './tweets.page.html',
  styleUrls: ['./tweets.page.scss'],
})
export class TweetsPage implements OnInit {

  tweets: Tweet[] = [];
  comments: Tweet[] = [];
  showFavorite = false;

  selectedIndex: number = null;

  constructor(
    private tweetsService: TweetsService,
    private modalCtrl: ModalController,
    private auth: AuthService,
    private uniLoader: UniLoaderService,
    private toastService: ToastService
  ) { }

  async ngOnInit() {

    // Quando carico la pagina, riempio il mio array di Tweets
    await this.getTweets();

  }



  async getTweets() {

    try {

      // Avvio il loader
      await this.uniLoader.show();

      // Popolo il mio array di oggetti 'Tweet' con quanto restituito dalla chiamata API
      this.tweets = await this.tweetsService.getTweets();

      // La chiamata è andata a buon fine, dunque rimuovo il loader
      await this.uniLoader.dismiss();

    } catch (err) {

      // Nel caso la chiamata vada in errore, mostro l'errore in un toast
      await this.toastService.show({
        message: err.message,
        type: ToastTypes.ERROR
      });

    }

  }

  findFav(tweet: Tweet){
    if(this.showFavorite){
      if(tweet._favorites.length > 0) return true;
      else return false;
    }else{
      return true;
    }
  }

  setShowFavorite(){
    this.showFavorite = !this.showFavorite;
  }

  async getComment(id: string, index: number) {

    if(this.selectedIndex == index)
      this.selectedIndex = null;
    else this.selectedIndex = index;

    try {

      // Avvio il loader
      await this.uniLoader.show();

      // Popolo il mio array di oggetti 'Tweet' con quanto restituito dalla chiamata API
      this.comments = await this.tweetsService.getComments(id);

      console.log(JSON.stringify(this.comments));

      // La chiamata è andata a buon fine, dunque rimuovo il loader
      await this.uniLoader.dismiss();

    } catch (err) {

      // Nel caso la chiamata vada in errore, mostro l'errore in un toast
      await this.toastService.show({
        message: err.message,
        type: ToastTypes.ERROR
      });

    }

  }


  async createOrEditTweet(type?: number, tweet?: Tweet, tweetId?: string) {

    /*
        Creo una modal (assegnandola ad una variabile)
        per permettere all'utente di scrivere un nuovo tweet
        */
       console.log("type "+ type);
       console.log("tweet "+ tweet);
       console.log("tweetId: " + tweetId);
    const modal = await this.modalCtrl.create({
      component: NewTweetPage,  


      componentProps: {
        type,
        tweet,
        tweetId
      } // Passo il parametro tweet. Se non disponibile, rimane undefined.
    });

    /*
        Quando l'utente chiude la modal ( modal.onDidDismiss() ),
        aggiorno il mio array di tweets
    */
    modal.onDidDismiss()
    .then(async () => {

      // Aggiorno la mia lista di tweet, per importare le ultime modifiche apportate dall'utente
      await this.getTweets();

      // La chiamata è andata a buon fine, dunque rimuovo il loader
      await this.uniLoader.dismiss();

    });

    // Visualizzo la modal
    return await modal.present();

  }

  async deleteTweet(tweet: Tweet) {

    try {

      // Mostro il loader
      await this.uniLoader.show();

      // Cancello il mio tweet
      await this.tweetsService.deleteTweet(tweet._id);

      // Riaggiorno la mia lista di tweets
      await this.getTweets();

      // Mostro un toast di conferma
      await this.toastService.show({
        message: 'Your tweet was deleted successfully!',
        type: ToastTypes.SUCCESS
      });

    } catch (err) {

      // Nel caso la chiamata vada in errore, mostro l'errore in un toast
      await this.toastService.show({
        message: err.message,
        type: ToastTypes.ERROR
      });

    }

    // Chiudo il loader
    await this.uniLoader.dismiss();

  }

  async addRemoveLike(tweet: Tweet){
    try {

      // Mostro il loader
      await this.uniLoader.show();

      // Rimuovo like se presente
      if(this.IsLike(tweet))
        await this.tweetsService.deleteLike(tweet);
      
      //Aggiungo like se non presente
      else
        await this.tweetsService.addLike(tweet._id);
     
      // Riaggiorno la mia lista di tweets
      await this.getTweets();

    } catch (err) {

      // Nel caso la chiamata vada in errore, mostro l'errore in un toast
      await this.toastService.show({
        message: err.message,
        type: ToastTypes.ERROR
      });

    }

    // Chiudo il loader
    await this.uniLoader.dismiss();

  }

  async addToFavorite(tweet: Tweet){

    // Mostro il loader
    await this.uniLoader.show();

    console.log("tweetId: " + tweet._id);
    
    if(!this.checkFavorite(tweet))
      await this.tweetsService.addToFav(tweet._id);
    else await this.tweetsService.delFromFav(tweet._id);
    await this.uniLoader.dismiss();

    await this.getTweets();
  }

  

  checkFavorite(tweet: Tweet){
    if(tweet._favorites.includes(this.auth.me._id)){
      return true;
    }
    return false;
    //   console.log("CheckFavorite: " + tweet._favorites.includes(this.auth.me._id) + " tweet: " + tweet.tweet);  
    // // console.log(JSON.stringify(tweet));
    // return true;
  }

  IsLike(tweet: Tweet): boolean{
   
    for(var i= 0; i<tweet._likes.length; ++i){
      if(tweet._likes[i] == this.auth.me._id){
        return true;
      }
    }
    /*tweet._likes.forEach(function (value) {
      console.log("value", value);
      if(value == aut_id){
      console.log(value == aut_id)
      return true;
    }
    });*/
    return false;
  }

  canEdit(tweet: Tweet): boolean {

    // Controllo che l'autore del tweet coincida col mio utente
    if (tweet._author) {
      return tweet._author._id === this.auth.me._id;
    }

    return false;

  }

  // Metodo bindato con l'interfaccia in Angular
  getAuthor(tweet: Tweet): string {

    if (this.canEdit(tweet)) {
      return 'You';
    } else {
      return tweet._author.name + ' ' + tweet._author.surname;
    }

    /* ------- UNA FORMA PIÚ SINTETICA PER SCRIVERE STA FUNZIONE: -------

      return this.canEdit(tweet) ? 'You' : `${tweet._author.name} ${tweet._author.surname}`;

    */

  }

}
