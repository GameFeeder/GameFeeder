import Provider from './providers/provider';
import Game from './game';
import Notification from './notifications/notification';
import DataManager from './managers/data_manager';
import ConfigManager from './managers/config_manager';
import NotificationElement from './notifications/notification_element';
import Logger from './logger';
import request from 'request-promise-native';
import cheerio from 'cheerio';

export default class DotaProvider extends Provider {
  public static logger = new Logger('Dota Provider');
  public lastPatch: string;

  constructor() {
    super(`http://www.dota2.com/patches/`, `Gameplay Patch`, Game.getGameByName('dota'));

    this.lastPatch = DataManager.getUpdaterData().lastDotaPatch;
  }

  public async getNotifications(date?: Date, limit?: number): Promise<Notification[]> {
    let notifications: Notification[] = [];
    try {
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
      notifications = newPatches.map((value) => {
        return new Notification()
          .withGameAndFooter(this.game)
          .withTitle(`Gameplay patch ${value}`, `http://www.dota2.com/patches/${value}`)
          .withAuthor('Dota 2');
      });
    } catch (error) {
      DotaProvider.logger.error(
        `Dota updates page parsing failed, error: ${error.substring(0, 120)}`,
      );
    } finally {
      return notifications;
    }
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

    $('#PatchSelector option').each(function() {
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
