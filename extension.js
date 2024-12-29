//    Proton VPN Button
//    GNOME Shell extension
//    @fthx 2024


import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';


const APP_NAME = 'protonvpn-app.desktop';

const ProtonVPNButton = GObject.registerClass(
class ProtonVPNButton extends PanelMenu.Button {
    _init(path) {
        super._init();

        let activeStateIconPath = path + "/icons/connected.svg";
        let inactiveStateIconPath = path + "/icons/disconnected.svg";
        this._activeStateIcon = Gio.icon_new_for_string(activeStateIconPath);
        this._inactiveStateIcon = Gio.icon_new_for_string(inactiveStateIconPath);

        this._box = new St.BoxLayout({reactive: true, style_class: 'panel-button'});
        this._icon = new St.Icon({style_class: 'system-status-icon'});
        this._label = new St.Label({y_align: Clutter.ActorAlign.CENTER, style_class: "user-label"});

        this._box.add_child(this._icon);
        this._box.add_child(this._label);
        this.add_child(this._box);

        this.connectObject('button-release-event', this._onClicked.bind(this), this);

        this._timeout = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._toggle = Main.panel.statusArea.quickSettings._network._vpnToggle;

            this._checkApp();
            this._updateState();

            this._toggle._client?.connectObject('notify::active-connections', this._updateState.bind(this), this);

            return GLib.SOURCE_REMOVE;
        });
    }

    _updateState() {
        this._id = this._toggle._client?.primary_connection?.id || '';

        if (this._id.includes('ProtonVPN')) {
            this._icon.set_gicon(this._activeStateIcon);
            this._label.set_text(this._id.replace('ProtonVPN ', ''));
        } else {
            this._icon.set_gicon(this._inactiveStateIcon);
            this._label.set_text('');
        }
    }

    _checkApp() {
        this._app = Shell.AppSystem.get_default().lookup_app(APP_NAME);

        if (!this._app)
            Main.notify('Proton VPN extension', 'Warning: Proton VPN app not found', false);
    }

    _onClicked() {
        if (this._app?.get_n_windows() > 0)
            this._app?.request_quit();
        else
            this._app?.activate();
    }

    _destroy() {
        if (this._timeout) {
            GLib.Source.remove(this._timeout);
            this._timeout = null;
        }

        this._toggle._client?.disconnectObject(this);
        this._app?.disconnectObject(this);

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
        this._button._destroy();
        this._button = null;
    }
}
