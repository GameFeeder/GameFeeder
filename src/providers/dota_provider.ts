import assert from 'assert';
import fetch from 'node-fetch';
import Game from '../game.js';
import Logger from '../logger.js';
import { ProviderData } from '../managers/data_manager.js';
import Notification from '../notifications/notification.js';
import NotificationBuilder from '../notifications/notification_builder.js';
import Version from '../notifications/version.js';
import { limitEnd, removeSmallerEqThan } from '../util/array_util.js';
import rollbar_client from '../util/rollbar_client.js';
import Provider from './provider.js';

interface DotaPatch {
  patch_number: string;
  patch_name: string;
  patch_timestamp: number;
  patch_website?: string;
}

export default class DotaProvider extends Provider {
  public static key = 'dota_patches';
  public static relevant_game = 'dota';
  public static logger = new Logger('Dota Provider');

  constructor(dota: Game) {
    assert(
      dota.name === DotaProvider.relevant_game,
      `Wrong game ${dota.name} used for Dota Provider`,
    );
    super(`http://www.dota2.com/patches/`, `Dota Updates`, dota);
  }

  public async getNotifications(since: ProviderData, limit?: number): Promise<Notification[]> {
    let notifications: Notification[] = [];
    try {
      let patchList = await this.getPatchList();
      const lastPatchStr = this.getLastUpdateVersion(since);
      const lastPatch = lastPatchStr ? new Version(lastPatchStr) : undefined;
      const patchNumbers = patchList.map((patch) => new Version(patch.patch_number));
      const newPatches = removeSmallerEqThan(patchNumbers, lastPatch).map((patch) => patch.version);

      patchList = patchList.filter((patch) => newPatches.includes(patch.patch_number));

      patchList.sort((patch: DotaPatch, otherPatch: DotaPatch) => {
        return patch.patch_timestamp - otherPatch.patch_timestamp;
      });

      const patchDetails = await Promise.all(
        patchList.map((patch) => this.getPatchDetails(patch.patch_number)),
      );

      // Convert the patches to notifications
      notifications = patchList.map((patch, index) => {
        const versionStr = patch.patch_number;
        return new NotificationBuilder(new Date(), versionStr)
          .withGameDefaults(this.game)
          .withTitle(`Gameplay patch ${versionStr}`, `http://www.dota2.com/patches/${versionStr}`)
          .withAuthor('Dota 2')
          .withContent(patchDetails[index])
          .build();
      });

      notifications = limitEnd(notifications, limit);
    } catch (error) {
      rollbar_client.reportCaughtError('Dota updates page parsing failed', error, this.logger);
    }
    return notifications;
  }

  /** Gets a list of the patch names available. */
  async getPatchList(): Promise<DotaPatch[]> {
    try {
      const response = await fetch(
        'https://www.dota2.com/datafeed/patchnoteslist?language=english',
      );
      const body = await response.text();
      const patchList = JSON.parse(body).patches;
      return patchList;
    } catch (error) {
      rollbar_client.reportCaughtError('Failed to get Dota patch list', error, this.logger);
      return [];
    }
  }

  async getPatchDetails(version: string): Promise<string> {
    try {
      const response = await fetch(
        `https://www.dota2.com/datafeed/patchnotes?version=${version}&language=english`,
      );
      const body = await response.text();
      const patchDetails = JSON.parse(body);
      const genericChanges = patchDetails.generic?.length ?? 0;
      const heroChanges = patchDetails.heroes?.length ?? 0;
      const itemChanges = patchDetails.items?.length ?? 0;
      const neutralItemChanges = patchDetails.neutral_items?.length ?? 0;
      return `${genericChanges} generic changes, ${heroChanges} hero changes, ${itemChanges} item changes, ${neutralItemChanges} neutral item changes`;
    } catch (error) {
      rollbar_client.reportCaughtError(
        `Failed to get Dota patch details for version ${version}`,
        error,
        this.logger,
      );
      return '';
    }
  }
}
