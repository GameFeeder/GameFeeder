import fetch from 'node-fetch';
import { HTMLElement, parse } from 'node-html-parser';
import Provider from './provider';
import Game from '../game';
import Notification from '../notifications/notification';
import Logger from '../logger';
import NotificationBuilder from '../notifications/notification_builder';
import Updater from '../updater';
import { limitEnd, removeSmallerEqThan, sort } from '../util/array_util';
import Version from '../notifications/version';

export default class DotaProvider extends Provider {
  public static key = 'dota';
  public static logger = new Logger('Dota Provider');

  constructor() {
    const dota = Game.getGameByName('dota');

    if (!dota) {
      throw new Error('Could not find Dota 2 game.');
    }

    super(`http://www.dota2.com/patches/`, `Dota Updates`, dota);
  }

  public async getNotifications(updater: Updater, limit?: number): Promise<Notification[]> {
    let notifications: Notification[] = [];
    try {
      const pageDoc = await this.getPatchPage();
      const patchList = await this.getPatchList(pageDoc);
      const lastPatchStr = this.getLastUpdateVersion(updater);
      const lastPatch = lastPatchStr ? new Version(lastPatchStr) : undefined;

      const newPatches = sort(
        removeSmallerEqThan(
          patchList.map((patch) => new Version(patch)),
          lastPatch,
        ),
      );

      // Convert the patches to notifications
      notifications = newPatches.map((patch) => {
        const versionStr = patch.version;
        return new NotificationBuilder(new Date(), versionStr)
          .withGameDefaults(this.game)
          .withTitle(`Gameplay patch ${versionStr}`, `http://www.dota2.com/patches/${versionStr}`)
          .withAuthor('Dota 2')
          .build();
      });

      notifications = limitEnd(notifications, limit);
    } catch (error) {
      this.logger.error(`Dota updates page parsing failed, error: ${error.substring(0, 120)}`);
    }
    return notifications;
  }

  /** Gets a list of the patch names available. */
  public getPatchList(pageDoc: HTMLElement): string[] {
    return pageDoc
      .querySelector('#PatchSelector') // Find the patch selector
      .childNodes.filter((node) => node.nodeType === 1) // Remove intermidiate nodes
      .map((node) => node.childNodes[0].rawText) // extract option element text
      .filter((text) => text !== 'Select an Update...'); // remove placeholder option
  }

  /** Gets the content of the patch page. */
  public async getPatchPage(): Promise<HTMLElement> {
    const response = await fetch('http://www.dota2.com/patches/');
    const updatesPage = await response.text();
    return parse(updatesPage);
  }
}
