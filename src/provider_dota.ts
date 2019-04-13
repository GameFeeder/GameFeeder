import Provider from './provider';
import { Game } from './game';
import BotNotification from './notification';
import { getUpdaterConfig, setUpdaterConfig } from './data';
import NotificationElement from './notification_element';
import botLogger from './bot_logger';
import request from 'request-promise-native';
import cheerio from 'cheerio';

export default class DotaProvider extends Provider {
  constructor() {
    super(`http://www.dota2.com/patches/`, `Gameplay Patch`, Game.getGameByName('dota'));
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    const pageDoc = await this.getPatchPage();
    const patchList = await this.getPatchList(pageDoc);
    const updater = getUpdaterConfig().updater;
    botLogger.debug(`Updater: '${JSON.stringify(updater)}'`);
    let lastPatch = updater.lastDotaPatch;
    botLogger.debug(`LastPatch: '${lastPatch}'`);
    const newPatches = [];

    for (let i = 0; (i < patchList.length) && (patchList[i] !== lastPatch); i++) {
      newPatches.push(patchList[i]);
    }

    lastPatch = newPatches[0];
    this.setLastPatch(lastPatch);

    const notifications = newPatches.map((value) => {
      return new BotNotification(
        this.game,
        'New gameplay update!',
        new NotificationElement(
          `Gameplay patch ${value}`,
          `http://www.dota2.com/patches/${value}`,
        ),
        `Gameplay patch ${value}`,
         new Date(),
         '',
         '',
         new NotificationElement('Dota 2'),
      );
    });

    return notifications;
  }

  private setLastPatch(lastPatch: string): void {
    const updaterConfig = getUpdaterConfig();
    updaterConfig.updater.lastDotaPatch = lastPatch;
    setUpdaterConfig(updaterConfig);
  }

  public async getPatchList(pageDoc: CheerioStatic): Promise<string[]> {
    const patchList: string[] = [];
    const $ = pageDoc;
    botLogger.info(`Latest patch number: ${$('.PatchTitle').text()}`);
    $('#PatchSelector option').each(function () {
      const option = $(this).val();
      // botLogger.info(option);
      if (option !== 'Select an Update...') {
        patchList.push(option);
      }
    });
    return patchList;
  }

  public async getPatchPage(): Promise<CheerioStatic> {
    const options = {
      uri: 'http://www.dota2.com/patches/',
      transform: (body: any) => {
        return cheerio.load(body);
      },
    };
    return request(options);
  }
}
