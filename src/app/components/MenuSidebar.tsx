import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';

import { MenuIcon } from 'lucide-react';
import GridViewIcon from '@mui/icons-material/GridView';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HomeRepairServiceOutlinedIcon from '@mui/icons-material/HomeRepairServiceOutlined';
import FolderDeleteOutlinedIcon from '@mui/icons-material/FolderDeleteOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import SupervisedUserCircleOutlinedIcon from '@mui/icons-material/SupervisedUserCircleOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
type Anchor = 'top' | 'left' | 'bottom' | 'right';

export default function AnchorTemporaryDrawer() {
  const [state, setState] = React.useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

  const toggleDrawer =
    (anchor: Anchor, open: boolean) =>
      (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
          event.type === 'keydown' &&
          ((event as React.KeyboardEvent).key === 'Tab' ||
            (event as React.KeyboardEvent).key === 'Shift')
        ) {
          return;
        }

        setState({ ...state, [anchor]: open });
      };

  const list = (anchor: Anchor) => (
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <List>
        {[
          { text: 'Dashboard', href: '/dashboard' },
          { text: 'Jobs', href: '/jobs' },
          { text: 'Customers', href: '/customers' },
                  { text: 'Bins', href: '/bins' },
          { text: 'Inventory', href: '/inventory' },
          { text: 'Driver Jobs', href: '/driver-jobs' },
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
  <ListItemButton 
    component={Link} 
    href={item.href}
  >
                <ListItemIcon>
                  {item.text === 'Dashboard' && <GridViewIcon />}
                  {item.text === 'Jobs' && <LocalShippingOutlinedIcon />}
                  {item.text === 'Customers' && <HomeRepairServiceOutlinedIcon />}
                  {item.text === 'Email Recipients' && <EmailOutlinedIcon />}
                  {item.text === 'Companies' && <BusinessIcon />}
                  {item.text === 'Bins' && <FolderDeleteOutlinedIcon />}
                  {item.text === 'Inventory' && <InventoryOutlinedIcon />}
                  {item.text === 'Driver Jobs' && <SupervisedUserCircleOutlinedIcon />}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {['Settings', 'Logout'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <Link href={text === 'Settings' ? '/settings' : '/'} passHref>
              <ListItemButton>
                <ListItemIcon>
                  {index % 2 === 0 ? <SettingsOutlinedIcon /> : <ExitToAppOutlinedIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <div>
      {(['left'] as const).map((anchor) => (
        <React.Fragment key={anchor}>

          <MenuIcon onClick={toggleDrawer(anchor, true)} />

          <Drawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
          >
            {list(anchor)}
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}
