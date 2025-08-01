#!/bin/bash

# Script para agregar registros de validación SSL a Route 53

echo "=== Agregando registros de validación SSL ==="

HOSTED_ZONE_ID="Z05029433T0NAPOEDQDID"

# Crear archivo de cambios para validación SSL
cat > ssl-validation-records.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "_e7e33fef94337514a9bf918dadea896c.laburemos.com.ar.",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "_708e512b8019160b68448c702cc7a769.xlfgrmvvlj.acm-validations.aws."
                    }
                ]
            }
        }
    ]
}
EOF

# Aplicar cambios
echo "Aplicando registros de validación SSL..."
./aws/dist/aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://ssl-validation-records.json

if [ $? -eq 0 ]; then
    echo "✅ Registros de validación SSL agregados correctamente"
    echo ""
    echo "El certificado se validará automáticamente en los próximos minutos."
    echo "Puedes verificar el estado con:"
    echo "./aws/dist/aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886 --query 'Certificate.Status'"
else
    echo "❌ Error agregando registros de validación"
fi

rm -f ssl-validation-records.json