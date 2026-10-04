# StockScan

App móvil para contar productos mediante códigos QR.

## Flujo

1. Usuario inicia sesión con Firebase Authentication.
2. Escanea un QR.
3. Si el producto no existe, Firestore crea `products/{producto}` con `quantity: 1`.
4. Si ya existe, una transacción aumenta `quantity` en 1.
5. Cada lectura se guarda en `scanHistory`.
6. La lista muestra cada producto una sola vez con su cantidad acumulada.

## Crear el proyecto

Recomendado con Expo actual:

```bash
npx create-expo-app@latest stockscan-app
cd stockscan-app
```

Luego reemplazá los archivos por los de este starter y ejecutá:

```bash
npx expo install expo-camera @react-native-async-storage/async-storage
npm install firebase
npx expo start
```

## Firebase

1. Crear proyecto en Firebase.
2. Activar Authentication > Email/Password.
3. Crear Firestore Database.
4. Registrar una aplicación Web en Firebase.
5. Copiar sus valores al archivo `.env` usando `.env.example` como base.
6. Publicar `firestore.rules` en Firestore.
7. Crear un usuario de prueba en Authentication.

## Importante

El QR debe contener el identificador del producto, por ejemplo `0010`, `0025`, `CAJA-100`, etc.

La operación de incremento usa una transacción de Firestore para que dos teléfonos puedan escanear el mismo producto sin simplemente sobrescribir la cantidad.
# StockScan
