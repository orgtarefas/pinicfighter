// firebase-config.js
class FirebaseManager {
    constructor() {
        this.db = null;
        this.init();
    }
    
    init() {
        try {
            firebase.initializeApp({
                apiKey: "AIzaSyDy_gqNrFR7KmMonXp7KfgRc15UVj0g3Nw",
                authDomain: "pinico-fighter.firebaseapp.com",
                databaseURL: "https://pinico-fighter-default-rtdb.firebaseio.com",
                projectId: "pinico-fighter",
                storageBucket: "pinico-fighter.firebasestorage.app",
                messagingSenderId: "152199667347",
                appId: "1:152199667347:web:9c74188c88bdee8633f766"
            });
            this.db = firebase.database();
            console.log("Firebase inicializado!");
        } catch (error) {
            console.log("Firebase não disponível. Modo offline ativado.");
        }
    }
    
    getDB() {
        return this.db;
    }
}

window.FirebaseManager = FirebaseManager;