#!/bin/bash

echo "=== Configuración de AWS CLI para LABUREMOS ==="
echo ""
echo "Por favor, ingresa las credenciales del usuario IAM 'laburemos-ci-user'"
echo "que acabas de crear en la consola AWS."
echo ""

# Configurar AWS CLI
export PATH=$PATH:~/.local/bin
aws configure

echo ""
echo "Verificando configuración..."
aws sts get-caller-identity

echo ""
echo "Si ves tu información de cuenta, ¡la configuración fue exitosa!"
echo "Ahora puedes ejecutar: ./aws-setup-deployment.sh"