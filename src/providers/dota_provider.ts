import request from 'request-promise-native';
import cheerio from 'cheerio';
import Provider from './provider';
import Game from '../game';
import Notification from '../notifications/notification';
import DataManager from '../managers/data_manager';
import ConfigManager from '../managers/config_manager';
import Logger from '../logger';
import NotificationBuilder from '../notifications/notification_builder';
import { assertIsDefined } from '../util/util';

export default class DotaProvider extends Provider {
  public static key = 'dota';
  public static logger = new Logger('Dota Provider');
  public lastPatch: string;

  constructor() {
    const dota = Game.getGameByName('dota');

    if (!dota) {
      throw new Error('Could not find Dota 2 game.');
    }

    super(`http://www.dota2.com/patches/`, `Gameplay Patch`, dota);

    const lastPatch = DataManager.getUpdaterData(DotaProvider.key).lastVersion;
    assertIsDefined(lastPatch);
    this.lastPatch = lastPatch;
  }

  public async getNotifications(): Promise<Notification[]> {
    let notifications: Notification[] = [];
    try {
      const pageDoc = await this.getPatchPage();
      const patchList = await this.getPatchList(pageDoc);
      let lastPatch = this.lastPatch;
      const newPatches = [];

      // Discard the old patches
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < patchList.length && patchList[i] !== lastPatch; i++) {
        newPatches.push(patchList[i]);
      }

      // Update the last patch version
      if (newPatches.length > 0) {
        lastPatch = newPatches[0];
        this.setLastPatch(lastPatch);
      }

      // Convert the patches to notifications
      notifications = newPatches.map((value) => {
        return new NotificationBuilder()
          .withGameDefaults(this.game)
          .withTitle(`Gameplay patch ${value}`, `http://www.dota2.com/patches/${value}`)
          .withAuthor('Dota 2')
          .build();
      });
    } catch (error) {
      this.logger.error(`Dota updates page parsing failed, error: ${error.substring(0, 120)}`);
    }
    return notifications;
  }

  /** Updates the last patch. */
  private setLastPatch(lastPatch: string): void {
    this.lastPatch = lastPatch;

    // If enabled, save the date in the data file.
    const updaterConfig = ConfigManager.getUpdatersConfig()[DotaProvider.key];

    if (!updaterConfig) {
      this.logger.error(
        `Failed to update patch number: Updater config '${DotaProvider.key}' not found.`,
      );
      return;
    }

    if (updaterConfig.autosave) {
      const updaterData = DataManager.getUpdaterData(DotaProvider.key);
      updaterData.lastVersion = lastPatch;
      DataManager.setUpdaterData(DotaProvider.key, updaterData);
    }
  }

  /** Gets a list of the patch names available. */
  public async getPatchList(pageDoc: CheerioStatic): Promise<string[]> {
    const patchList: string[] = [];
    const $ = pageDoc;

    // Get all options of the patch selector
    $('#PatchSelector option').each((_index, element) => {
      const option = $(element).val();

      // Remove the default option
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
      transform: (body: string) => {
        return cheerio.load(body);
      },
    };
    return request(options);
  }
}
