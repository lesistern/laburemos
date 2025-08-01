#!/bin/bash

echo "Searching for 'mt-20 pt-16 border-t border-gray-200' in frontend files..."

# Search in all relevant file types
find /mnt/c/xampp/htdocs/Laburar/frontend -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec grep -l "mt-20 pt-16 border-t border-gray-200" {} \;

# Also search for individual classes in case they're on separate lines
echo -e "\nSearching for individual classes..."
find /mnt/c/xampp/htdocs/Laburar/frontend -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec grep -l "mt-20" {} \; | head -5

echo -e "\nSearching for border-t border-gray-200..."
find /mnt/c/xampp/htdocs/Laburar/frontend -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec grep -l "border-t border-gray-200" {} \; | head -5