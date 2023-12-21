import fs from "fs";
import { KeyValueStore } from '../storage/storage';


export const restoreAlertHistory = (storage: KeyValueStore<number>): void => {
    fs.readFile("./logs/alerts.log", "utf-8", (err, file) => {
        if (err) console.log(err);
  
        file.split("\r\n")
            .filter((alert: string) => alert.length > 0)
            .map((alert: string) => {
                const keyValue = alert.replace("info: ", "").split(" ");
                const key = keyValue[0];
                const value = keyValue[2];
                storage.set(key, Number(value));
            });
    });
  }