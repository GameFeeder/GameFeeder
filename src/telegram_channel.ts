import { Message } from 'node-telegram-bot-api';
import { BotChannel } from './channel';

class TelegramChannel extends BotChannel {
  constructor(msg: Message) {
    super(msg.chat.title, msg.chat.id);
  }
  public isEqual(other: BotChannel): boolean {
    if (other instanceof TelegramChannel) {
      return ((this.label === other.label) && (this.id === other.id));
    }
    return false;
  }
}

export { TelegramChannel };
