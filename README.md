# ATOM CHALLENGE - EXPRESS

En este proyecto se realizó el desarrollo para el back-end del reto técnico.

Se trabajó con firebase tools para poder levantar un entorno local de desarrollo y posterior a todas las pruebas realizadas en postman se lanzó a producción en la infraestructura de google.
El despliegue se realizó en firebase function.
En una base de datos no relacional de firebase storage

## DEMO

https://drive.google.com/file/d/1MJkc5phSr7ZWbguoWna-RI6oyvs8gup9/view?usp=sharing

## Compilar

npm run build

## Ejecutar función en local

firebase emulators:start   

## Despliega todas las funciones 

firebase deploy --only functions

## Despliega una función específica 

firebase deploy --only functions:nombreFunction

## Eliminar una función específica

Firevase functions:delete nombreFunction

## Eliminar cache de compilación	

rm -rf dist/ && npm run build

## Corrige estilos de eslint

npx eslint --ext .js,.ts . --fix