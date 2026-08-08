import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export type RoomType = 'Single' | 'Twin' | 'Double' | 'Family' | 'Suite';
export type RoomFeature = 'WiFi' | 'TV' | 'Radio' | 'Refreshments' | 'Safe' | 'Views';

export interface NewRoom {
  roomNumber: string;
  type: RoomType;
  accessible: boolean;
  price: string;
  features?: RoomFeature[];
}

const featureCheckboxIds: Record<RoomFeature, string> = {
  WiFi: 'wifiCheckbox',
  TV: 'tvCheckbox',
  Radio: 'radioCheckbox',
  Refreshments: 'refreshCheckbox',
  Safe: 'safeCheckbox',
  Views: 'viewsCheckbox',
};

export class AdminRoomsPage extends BasePage {
  private readonly roomListings: Locator = this.page.getByTestId('roomlisting');
  private readonly roomNumberInput: Locator = this.page.locator('#roomName');
  private readonly typeSelect: Locator = this.page.locator('#type');
  private readonly accessibleSelect: Locator = this.page.locator('#accessible');
  private readonly priceInput: Locator = this.page.locator('#roomPrice');
  private readonly createButton: Locator = this.page.locator('#createRoom');

  async open(): Promise<void> {
    await this.goto('/admin/rooms');
  }

  async createRoom(room: NewRoom): Promise<void> {
    await this.roomNumberInput.fill(room.roomNumber);
    await this.typeSelect.selectOption(room.type);
    await this.accessibleSelect.selectOption(room.accessible ? 'true' : 'false');
    await this.priceInput.fill(room.price);
    for (const feature of room.features ?? []) {
      await this.page.locator(`#${featureCheckboxIds[feature]}`).check();
    }
    await this.createButton.click();
  }

  roomRow(roomNumber: string): Locator {
    return this.roomListings.filter({ has: this.page.locator(`#roomName${roomNumber}`) });
  }

  async deleteRoom(roomNumber: string): Promise<void> {
    await this.roomRow(roomNumber).locator('.roomDelete').click();
  }
}
