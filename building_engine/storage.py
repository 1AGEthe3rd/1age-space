import shutil
from pathlib import Path

class StorageBudgetExceeded(RuntimeError):pass

def ensure_space(path,required=0):
 if shutil.disk_usage(Path(path)).free<required+2*1024**3:
  raise StorageBudgetExceeded('2 GiB free-space reserve reached; committed import checkpoint retained')
