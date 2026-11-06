import { useState } from 'react';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Box, Button, Card, Dialog, Grid, Stack, TextField } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Iconify from 'src/components/iconify';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
export default function ProductsView() {

    const [order, setOrder] = useState('asc');
    const [openModal, setOpenModal] = useState(false);
    const [producto, setProducto] = useState('');

    const openModalAction = () => {
        setOpenModal(true);
        setProducto('');
    };
    const closeModalAction = () => {
        setOpenModal(false);
    };

    return (
        <Container>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Lista de Productos</Typography>
                <Button
                    variant="contained"
                    color="inherit"
                    startIcon={<Iconify icon="eva:plus-fill" />}
                    onClick={openModalAction}
                >
                    Nuevo Producto
                </Button>
            </Stack>

            <Card>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>N#</TableCell>
                                <TableCell align="right">Nombre</TableCell>
                                <TableCell align="right">Gramo</TableCell>
                                <TableCell align="right">Unidad x Caja</TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>
                </TableContainer>
            </Card>
            <Dialog open={openModal} onClose={closeModalAction}>
                <DialogTitle>Nuevo Producto</DialogTitle>
                <Box sx={{ flexGrow: 1 }} style={{ padding: '0px 30px' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={12}>
                            <TextField
                                style={{ width: '100%' }}
                                label="Nombre"
                                id="outlined-basic"
                                defaultValue=""
                                value={producto.nombre}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={12}>
                            <TextField
                                style={{ width: '100%' }}
                                label="Gramos"
                                id="filled-size-small"
                                defaultValue=""
                                value={producto.apellido}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={8} md={12}>
                            <TextField
                                style={{ width: '100%' }}
                                label="Unidad x Caja"
                                id="filled-size-small"
                                defaultValue=""
                                value={producto.cedula}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </Box>
                <DialogActions>
                    <Button autoFocus onClick={closeModalAction}>
                        Cancelar
                    </Button>
                    <Button onClick={closeModalAction} autoFocus>
                        Registrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}