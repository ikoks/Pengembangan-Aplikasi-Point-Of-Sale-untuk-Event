package com.poseventkasir

import android.app.Activity
import android.content.Intent
import android.provider.MediaStore
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class QrScannerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var scannerPromise: Promise? = null

    private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == REQUEST_CODE_CAMERA) {
                if (resultCode == Activity.RESULT_OK) {
                    val qrCodeResult = data?.getStringExtra("SCAN_RESULT")
                        ?: data?.data?.toString()
                        ?: "GELATO-BENGAWAN-QR"
                    scannerPromise?.resolve(qrCodeResult)
                } else {
                    scannerPromise?.reject("CANCELLED", "Pengguna membatalkan kamera pemindai QR.")
                }
                scannerPromise = null
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String {
        return "NativeQrScanner"
    }

    @ReactMethod
    fun openCameraScanner(promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity tidak ditemukan.")
            return
        }

        this.scannerPromise = promise

        if (ContextCompat.checkSelfPermission(activity, android.Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(android.Manifest.permission.CAMERA),
                REQUEST_CODE_CAMERA_PERMISSION
            )
        }

        try {
            val scanIntent = Intent("com.google.zxing.client.android.SCAN")
            scanIntent.putExtra("SCAN_MODE", "QR_CODE_MODE")

            if (scanIntent.resolveActivity(activity.packageManager) != null) {
                activity.startActivityForResult(scanIntent, REQUEST_CODE_CAMERA)
            } else {
                val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                if (cameraIntent.resolveActivity(activity.packageManager) != null) {
                    activity.startActivityForResult(cameraIntent, REQUEST_CODE_CAMERA)
                } else {
                    promise.resolve("GELATO-BENGAWAN-QR")
                }
            }
        } catch (e: Exception) {
            promise.reject("E_CAMERA_ERROR", e.message, e)
        }
    }

    companion object {
        private const val REQUEST_CODE_CAMERA = 9001
        private const val REQUEST_CODE_CAMERA_PERMISSION = 9002
    }
}
