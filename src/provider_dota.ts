import Provider from './provider';
import { Game } from './game';
import BotNotification from './notification';
import DataManager from './data_manager';
import ConfigManager from './config_manager';
import NotificationElement from './notification_element';
import botLogger from './bot_logger';
import request from 'request-promise-native';
import cheerio from 'cheerio';

export default class DotaProvider extends Provider {
  public lastPatch: string;

  constructor() {
    super(`http://www.dota2.com/patches/`, `Gameplay Patch`, Game.getGameByName('dota'));

    this.lastPatch = DataManager.getUpdaterData().lastDotaPatch;
  }

  public async getNotifications(date?: Date, limit?: number): Promise<BotNotification[]> {
    const pageDoc = await this.getPatchPage();
    const patchList = await this.getPatchList(pageDoc);
    let lastPatch = this.lastPatch;
    const newPatches = [];

    // Discard the old patches
    for (let i = 0; i < patchList.length && patchList[i] !== lastPatch; i++) {
      newPatches.push(patchList[i]);
    }

    // Update the last patch version
    if (newPatches.length > 0) {
      lastPatch = newPatches[0];
      this.setLastPatch(lastPatch);
    }

    // Convert the patches to notifications
    const notifications = newPatches.map((value) => {
      return new BotNotification(
        this.game,
        'New gameplay update!',
        new NotificationElement(`Gameplay patch ${value}`, `http://www.dota2.com/patches/${value}`),
        `Gameplay patch ${value}`,
        new Date(),
        '',
        '',
        new NotificationElement('Dota 2'),
      );
    });

    return notifications;
  }

  /** Updates the last patch. */
  private setLastPatch(lastPatch: string): void {
    this.lastPatch = lastPatch;

    // If enabled, save the date in the data file.
    const updaterConfig = ConfigManager.getUpdaterConfig();
    if (updaterConfig.autosave) {
      const updaterData = DataManager.getUpdaterData();
      updaterData.lastDotaPatch = lastPatch;
      DataManager.setUpdaterData(updaterData);
    }
  }

  /** Gets a list of the patch names available. */
  public async getPatchList(pageDoc: CheerioStatic): Promise<string[]> {
    const patchList: string[] = [];
    const $ = pageDoc;

    $('#PatchSelector option').each(function () {
      const option = $(this).val();
      // botLogger.info(option);
      if (option !== 'Select an Update...') {
        patchList.push(option);
      }
    });
    return patchList;
  }

  /** Gets the content of the patch page. */
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
