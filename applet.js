const Applet = imports.ui.applet;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const UUID = "mementomori@kogs";
const APPLET_PATH = imports.ui.appletManager.appletMeta[UUID].path;


function MementoMoriApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MementoMoriApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        
        this.set_applet_tooltip(_("You will die."));
        this.set_applet_label('');
        this.orientation = orientation;
        this.instance_id = instance_id;
        this.preferences = {};
        this.deathstamp = 0;
        
        try {
            this.bindPrefs();
            this.updateTimestamp();
            this.updateIcon();
            
            

            this._update_loop();
        } catch(e) {
            global.logError(e);
            this.setErrorState(' Something went wrong.');
        }
    },

    on_applet_clicked: function() {
        this.menu.toggle();
    },

    updateIcon: function() {
        const icon = this.preferences.use_black_icon ? "/icon_black.png" : "/icon.png";
        this.set_applet_icon_path(APPLET_PATH + icon);
    },

    bindPrefs: function() {
        this.settings = new Settings.AppletSettings(this.preferences, UUID, this.instance_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "birth_date", "birth_date", this.onSettingsChanged.bind(this), null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "life_expectancy", "life_expectancy", this.onSettingsChanged.bind(this), null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "use_black_icon", "use_black_icon", this.onSettingsChanged.bind(this), null);
    },

    setOkayState: function() {
        // this.set_applet_icon_path(APPLET_PATH + "/icon.png");
        this.set_applet_label('');
    },

    setAlertState: function(message) {
        // this.set_applet_icon_path(APPLET_PATH + "/icon_alert.png");
        this.set_applet_label(message);
    },

    setErrorState: function(message) {
        // this.set_applet_icon_path(APPLET_PATH + "/icon_message.png");
        this.set_applet_label(message);
    },

    onSettingsChanged: function(apiKey) {
        this.updateTimestamp();
        this.updateIcon();
    },

    updateTimestamp: function() {
        // set timestamp based on settings
        global.log('timestamp', this.timestamp, this.preferences.birth_date, this.preferences.life_expectancy);
        const birth = new Date(this.preferences.birth_date);


        let year = birth.getFullYear();
        let month = birth.getMonth();
        let day = birth.getDate();
        let death = new Date(year + parseInt(this.preferences.life_expectancy, 10), month, day);

        this.deathstamp = death.valueOf();
    },

    msToTimestring: function(duration) {
        var milliseconds = Math.floor((duration % 1000) / 100),
            seconds = Math.floor((duration / 1000) % 60),
            minutes = Math.floor((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
            days = Math.floor((duration / (1000 * 60 * 60 * 24)));
        
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        this.set_applet_tooltip(_(`You will die in ${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds.`));
        
        return days + ':' + hours + ":" + minutes + ":" + seconds;
    },

    updateLabel: function() {
        if(this.deathstamp > 0) {
            let label = this.msToTimestring(this.deathstamp.valueOf() - Date.now().valueOf());
            this.set_applet_label(label);
        } else {
            this.set_applet_label(' Something went wrong.');
        }
    },



    /************************* LOOP */
    on_applet_removed_from_panel: function () {
        // stop the loop when the applet is removed
        if (this._updateLoopID) {
            Mainloop.source_remove(this._updateLoopID);
        }
    
    },
    
    _update_loop: function () {
        this.updateLabel();
        this._updateLoopID = Mainloop.timeout_add(1000, Lang.bind(this, this._update_loop));
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MementoMoriApplet(orientation, panel_height, instance_id);
}
