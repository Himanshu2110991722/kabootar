package in.kabutar.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Edge-to-edge display ───────────────────────────────────────────────
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        View decorView = window.getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        );

        // ── Notification channels ──────────────────────────────────────────────
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannels();
        }
    }

    private void createNotificationChannels() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel chat = new NotificationChannel(
            "kabutar_chat", "Chat Messages", NotificationManager.IMPORTANCE_HIGH);
        chat.setDescription("Messages from travelers and senders");
        chat.enableLights(true);
        chat.setLightColor(0xFFF97316);
        chat.enableVibration(true);
        chat.setVibrationPattern(new long[]{0, 200, 100, 200});
        nm.createNotificationChannel(chat);

        NotificationChannel parcels = new NotificationChannel(
            "kabutar_parcels", "Parcel Updates", NotificationManager.IMPORTANCE_HIGH);
        parcels.setDescription("Parcel requests, acceptance, and delivery confirmations");
        parcels.enableLights(true);
        parcels.setLightColor(0xFF22C55E);
        parcels.enableVibration(true);
        nm.createNotificationChannel(parcels);

        NotificationChannel trips = new NotificationChannel(
            "kabutar_trips", "Trip Alerts", NotificationManager.IMPORTANCE_DEFAULT);
        trips.setDescription("New trips and travel updates in your area");
        trips.enableLights(true);
        trips.setLightColor(0xFF3B82F6);
        nm.createNotificationChannel(trips);

        NotificationChannel general = new NotificationChannel(
            "kabutar_default", "General", NotificationManager.IMPORTANCE_DEFAULT);
        general.setDescription("General Kabutar notifications");
        nm.createNotificationChannel(general);
    }
}
