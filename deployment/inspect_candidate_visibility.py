import json
import os
import sys
from pathlib import Path

candidate=Path.home()/'releases/2.3.0-2873e64b/candidate'
os.chdir(candidate)
sys.path.insert(0,str(candidate))
os.environ['DJANGO_SETTINGS_MODULE']='project.settings'
os.environ['DATABASE_URL']=''
import django
django.setup()
from core.models import Business
from core.publication import public_businesses
visible=set(public_businesses().values_list('pk',flat=True))
print(json.dumps([{'id':b.pk,'slug':b.slug,'business_status':b.status,'candidate_visible':b.pk in visible,
    'campaigns':list(b.advertisements.values('id','is_primary','status','starts_at','ends_at'))}
    for b in Business.objects.filter(status='active')],default=str,indent=2))
