import { Component, Prop, h } from '@stencil/core';
import { popoverController } from '@ionic/core';

@Component({
  tag: 'edit-popover'
})
export class EditPopover {
  @Prop() selectedPhotos: any[] = [];
  @Prop() deleteCallback: any;
  @Prop() rotateCallback: any;

  async closePopover() {
    await popoverController.dismiss();
  }

  async delete() {
    await this.closePopover();
    this.deleteCallback();
  }

  rotate() {
    this.closePopover();
    this.rotateCallback();
  }

  render() {
    return (
      <ion-list>
        <ion-item
          class="pointer"
          hidden={!this.rotateCallback}
          detail={false}
          onClick={() => this.rotate()}
        >
          <ion-icon slot="start" color="primary" name="sync" />
          <ion-label>Rotate</ion-label>
        </ion-item>
        <ion-item class="pointer" detail={false} onClick={() => this.delete()}>
          <ion-icon slot="start" color="primary" name="trash" />
          <ion-label>Delete</ion-label>
        </ion-item>
      </ion-list>
    );
  }
}
