import React from 'react';
import { Container } from 'react-bootstrap';


function Home() {
    return(
      <div>
        <Container>
        <section>
          <div class="row justify-content-center">
              <div class="col-xxl-8">
                  <div class="text-center my-5">
                      <h2 class="display-5 fw-bolder"><span class="text-gradient d-inline">Prizes for Winners</span></h2>
                      <p class="lead fw-light mb-4">We are thrilled to offer cash prizes to reward the creativity and skill of our winners. Here’s what you can win in the competition:</p>
                      <h4>Grand Prize: RM1,000 Cash</h4>
                      <p class="fw-light">
                          The Grand Prize winner will receive a $1,000 cash award to further support their photography journey or to invest in new gear or creative pursuits. This prize recognizes the best overall entry, showcasing exceptional talent and originality.</p>
                      <h4>Second Place: RM500 Cash</h4>
                      <p class="fw-light">
                          The Second Place winner will be awarded $500 cash. This prize celebrates outstanding photography and creativity, offering a substantial reward for your effort and skill.</p>
                      <h4>People’s Choice Award: RM200 Cash</h4>
                      <p class="fw-light">
                          The People’s Choice Award will be given to the photo that receives the most votes from the public. The winner will receive $200 in cash, along with the honor of having the community’s vote for the best photo.</p>
                  </div>
              </div>
          </div>
        </section>
      </Container>
      </div>    
    );
}

export default Home;