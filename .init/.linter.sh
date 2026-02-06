#!/bin/bash
cd /home/kavia/workspace/code-generation/contact-management-system-214191-214201/contacts_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

