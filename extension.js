//    Proton VPN Button
//    GNOME Shell extension
//    @fthx 2025


import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';


const APP_NAME = 'proton.vpn.app.gtk.desktop';
const FLATPAK_APP_NAME = 'com.protonvpn.www.desktop';
const INACTIVE_VPN_ICON_OPACITY = 128;

const ProtonVPNButton = GObject.registerClass(
    class ProtonVPNButton extends PanelMenu.Button {
        _init(path) {
            super._init();

            const iconPath = `${path}/icons/protonvpn-symbolic.svg`;
            const gicon = Gio.icon_new_for_string(iconPath);

            this._box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
            this._icon = new St.Icon({ style_class: 'system-status-icon', gicon: gicon });
            this._label = new St.Label({ y_align: Clutter.ActorAlign.CENTER });

            this._box.add_child(this._icon);
            this._box.add_child(this._label);
            this.add_child(this._box);

            this.connectObject('button-press-event', () => this._onClicked(), this);

            this._timeout = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                this._toggle = Main.panel.statusArea.quickSettings?._network?._vpnToggle;

                this._checkApp();
                this._updateState();

                this._toggle?._client?.connectObject('notify::active-connections', () => this._updateState(), this);

                this._timeout = null;
                return GLib.SOURCE_REMOVE;
            });
        }

        _updateState() {
            this._id = this._toggle?.subtitle ?? '';

            if (this._toggle?.checked && this._id?.includes('ProtonVPN')) {
                this._icon.opacity = 255;
                this._label.text = this._id?.replace('ProtonVPN ', '') ?? '';
                this._label.show();
            } else {
                this._icon.opacity = INACTIVE_VPN_ICON_OPACITY;
                this._label.hide();
            }
        }

        _checkApp() {
            this._app = Shell.AppSystem.get_default().lookup_app(APP_NAME);

            if (!this._app)
                this._app = Shell.AppSystem.get_default().lookup_app(FLATPAK_APP_NAME);

            if (!this._app)
                Main.notify('Proton VPN extension', 'Warning: Proton VPN app not found', false);
        }

        _onClicked() {
            if (this._app?.get_n_windows() > 0)
                this._app?.request_quit();
            else
                this._app?.activate();
        }

        destroy() {
            if (this._timeout) {
                GLib.Source.remove(this._timeout);
                this._timeout = null;
            }

            this._toggle?._client?.disconnectObject(this);

            super.destroy();
        }
    });

export default class ProtonVPNButtonExtension extends Extension {
    constructor(metadata) {
        super(metadata);
    }

    enable() {
        this._button = new ProtonVPNButton(this.path);
        Main.panel.addToStatusArea('Proton VPN Button', this._button);
    }

    disable() {
        this._button?.destroy();
        this._button = null;
    }
}
